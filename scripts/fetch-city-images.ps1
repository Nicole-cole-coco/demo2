$ErrorActionPreference = 'Stop'
$projectRoot = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$outputDirectory = Join-Path $projectRoot 'public\cities'
$manifestPath = Join-Path $outputDirectory 'attribution.json'
$requestHeaders = @{ 'User-Agent' = 'LvceTravelPlanner/1.0 (city imagery attribution build)' }

$targets = @(
  @{ slug='tianjin'; city='天津'; title='天津市' },
  @{ slug='datong'; city='大同'; title='大同市' },
  @{ slug='shenyang'; city='沈阳'; title='沈阳市' },
  @{ slug='dalian'; city='大连'; title='大连市' },
  @{ slug='harbin'; city='哈尔滨'; title='哈尔滨市' },
  @{ slug='xiamen'; city='厦门'; title='厦门市' },
  @{ slug='wuhan'; city='武汉'; title='武汉市' },
  @{ slug='changsha'; city='长沙'; title='长沙市' },
  @{ slug='luoyang'; city='洛阳'; title='洛阳市' },
  @{ slug='zhangjiajie'; city='张家界'; title='张家界市' },
  @{ slug='shenzhen'; city='深圳'; title='深圳市' },
  @{ slug='sanya'; city='三亚'; title='三亚市' },
  @{ slug='kunming'; city='昆明'; title='昆明市' },
  @{ slug='lijiang'; city='丽江'; title='丽江市' },
  @{ slug='lanzhou'; city='兰州'; title='兰州市' },
  @{ slug='dunhuang'; city='敦煌'; title='莫高窟' },
  @{ slug='urumqi'; city='乌鲁木齐'; title='乌鲁木齐市' },
  @{ slug='ningbo'; city='宁波'; title='天一阁' },
  @{ slug='shaoxing'; city='绍兴'; title='鲁迅故里' },
  @{ slug='fuzhou'; city='福州'; title='三坊七巷' },
  @{ slug='jinan'; city='济南'; title='趵突泉' },
  @{ slug='guiyang'; city='贵阳'; title='贵阳市'; file='Jiaxiu building and Nanming river in Guiyang.jpg' },
  @{ slug='hongkong'; city='香港'; title='維多利亞港' },
  @{ slug='macau'; city='澳门'; title='大三巴牌坊' },
  @{ slug='taipei'; city='台北'; title='臺北市' },
  @{ slug='kaohsiung'; city='高雄'; title='高雄市' }
)

function Get-PlainText([string]$value) {
  if (-not $value) { return '' }
  return ([System.Net.WebUtility]::HtmlDecode(($value -replace '<[^>]+>', ' ')) -replace '\s+', ' ').Trim()
}

function Invoke-JsonWithRetry([string]$uri) {
  for ($attempt = 1; $attempt -le 4; $attempt += 1) {
    try {
      Start-Sleep -Milliseconds 850
      return Invoke-RestMethod -Uri $uri -Headers $requestHeaders
    } catch {
      if ($attempt -eq 4) { throw }
      Start-Sleep -Seconds (5 * $attempt)
    }
  }
}

function Save-Manifest($records) {
  $manifest = [ordered]@{
    generated_at = (Get-Date).ToUniversalTime().ToString('o')
    policy = '中文维基百科城市条目主图；图片文件来自 Wikimedia Commons，作者与许可保存在本清单，页面仅展示整洁来源入口。'
    count = $records.Count
    items = $records
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
$items = @()
$forceCities = @('香港', '澳门', '贵阳')
if (Test-Path -LiteralPath $manifestPath) {
  $existingManifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $items = @($existingManifest.items | Where-Object { $forceCities -notcontains $_.city })
}
foreach ($target in $targets) {
  if ($items.city -contains $target.city) { continue }
  if ($target.city -eq '香港') {
    $localPath = '/cities/hongkong.webp'
    $destinationPath = Join-Path $projectRoot 'public\cities\hongkong.webp'
    if (Test-Path -LiteralPath $destinationPath) { Remove-Item -LiteralPath $destinationPath -Force }
    $imageUrl = 'https://images.unsplash.com/photo-1579571107728-7ff5d90c8ad0?fm=webp&w=1600&q=82&fit=crop&crop=entropy'
    Invoke-WebRequest -Uri $imageUrl -Headers $requestHeaders -OutFile $destinationPath -UseBasicParsing
    $items += [ordered]@{
      city = '香港'; slug = 'hongkong'; page_title = '維多利亞港'; file_name = 'photo-1579571107728-7ff5d90c8ad0'
      local_path = $localPath; caption = '从维多利亚港眺望香港岛天际线'; author = 'Jason Ng'
      source_page = 'https://unsplash.com/photos/city-skyline-across-body-of-water-during-daytime-u6mbOIE8nd4'
      original_url = $imageUrl; license = 'Unsplash License'; license_url = 'https://unsplash.com/license'
      width = 1600; height = 900; retrieved_at = (Get-Date).ToUniversalTime().ToString('o')
    }
    Save-Manifest $items
    continue
  }
  $fileName = $target.file
  if (-not $fileName) {
    $pageQuery = 'https://zh.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=name%7Cthumbnail&pithumbsize=1800&titles=' + [uri]::EscapeDataString($target.title)
    $pagePayload = Invoke-JsonWithRetry $pageQuery
    $fileName = $pagePayload.query.pages[0].pageimage
  }
  if (-not $fileName) { throw "$($target.city) 没有页面主图" }

  $commonsQuery = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize&iiurlwidth=1800&titles=' + [uri]::EscapeDataString("File:$fileName")
  $commonsPayload = Invoke-JsonWithRetry $commonsQuery
  $page = $commonsPayload.query.pages[0]
  $info = $page.imageinfo[0]
  if (-not $info.thumburl -or -not $info.descriptionurl) { throw "$fileName 缺少 Commons 图片信息" }

  $localPath = if ($target.city -eq '澳门') { '/cities/macau.jpg' } else { "/cities/$($target.slug).webp" }
  $destinationPath = Join-Path $projectRoot ("public" + ($localPath -replace '/', '\'))
  if ($forceCities -contains $target.city -and (Test-Path -LiteralPath $destinationPath)) {
    Remove-Item -LiteralPath $destinationPath -Force
  }
  if ($target.city -eq '澳门') {
    $legacyMacauPath = Join-Path $projectRoot 'public\cities\macau.webp'
    if (Test-Path -LiteralPath $legacyMacauPath) { Remove-Item -LiteralPath $legacyMacauPath -Force }
  }
  $cleanOriginalUrl = ([uri][string]$info.url).GetLeftPart([System.UriPartial]::Path)
  $proxyUrl = if ($target.city -eq '澳门') {
    $sourceUri = [uri]$cleanOriginalUrl
    'https://i0.wp.com/' + $sourceUri.Host + $sourceUri.AbsolutePath + '?resize=1600%2C1000&ssl=1'
  } else {
    'https://wsrv.nl/?url=' + [uri]::EscapeDataString($cleanOriginalUrl) + '&w=1600&output=webp&q=82'
  }
  if (-not (Test-Path -LiteralPath $destinationPath)) {
    Invoke-WebRequest -Uri $proxyUrl -Headers $requestHeaders -OutFile $destinationPath -UseBasicParsing
  }
  $metadata = $info.extmetadata
  $items += [ordered]@{
    city = $target.city
    slug = $target.slug
    page_title = $target.title
    file_name = $fileName
    local_path = $localPath
    caption = if ($metadata.ImageDescription.value) { Get-PlainText $metadata.ImageDescription.value } else { "$($target.city)城市代表性景观" }
    author = if ($metadata.Artist.value) { Get-PlainText $metadata.Artist.value } else { 'Wikimedia Commons contributor' }
    source_page = $info.descriptionurl
    original_url = $cleanOriginalUrl
    license = if ($metadata.LicenseShortName.value) { Get-PlainText $metadata.LicenseShortName.value } else { '开放许可，详见来源页' }
    license_url = if ($metadata.LicenseUrl.value) { $metadata.LicenseUrl.value } else { $info.descriptionurl }
    width = $info.thumbwidth
    height = $info.thumbheight
    retrieved_at = (Get-Date).ToUniversalTime().ToString('o')
  }
  Save-Manifest $items
}

Save-Manifest $items
Write-Output "Downloaded $($items.Count) city images."
