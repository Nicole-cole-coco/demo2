param(
  [int]$Shard = 0,
  [int]$ShardCount = 10
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$targetsPath = Join-Path $projectRoot 'docs\city-media-targets.json'
$outputRoot = Join-Path $projectRoot 'public\cities\media'
$manifestPath = Join-Path $projectRoot "content\cities\media-shard-$Shard.json"
$headers = @{ 'User-Agent' = 'LvceTravelPlanner/1.0 (open-license city media curation)' }
$catalog = Get-Content -LiteralPath $targetsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cities = @()
for ($index = 0; $index -lt $catalog.cities.Count; $index += 1) {
  if (($index % $ShardCount) -eq $Shard) { $cities += $catalog.cities[$index] }
}
$used = [Collections.Generic.HashSet[string]]::new()
$result = [ordered]@{ generatedAt='2026-08-09'; shard=$Shard; shardCount=$ShardCount; cities=[ordered]@{} }

function PlainText([string]$value) {
  if (-not $value) { return '' }
  return ([Net.WebUtility]::HtmlDecode(($value -replace '<[^>]+>', ' ')) -replace '\s+', ' ').Trim()
}

function RequestJson([string]$uri) {
  for ($attempt = 1; $attempt -le 4; $attempt += 1) {
    try { return Invoke-RestMethod -Uri $uri -Headers $headers -TimeoutSec 90 }
    catch {
      if ($attempt -eq 4) { throw }
      Start-Sleep -Seconds (2 * $attempt)
    }
  }
}

function ResolvePage($payload, [string]$requestedTitle) {
  $resolvedTitle = $requestedTitle
  foreach ($normalized in @($payload.query.normalized)) { if ($normalized.from -eq $resolvedTitle) { $resolvedTitle = $normalized.to } }
  foreach ($redirect in @($payload.query.redirects)) { if ($redirect.from -eq $resolvedTitle) { $resolvedTitle = $redirect.to } }
  $page = @($payload.query.pages) | Where-Object { $_.title -eq $resolvedTitle } | Select-Object -First 1
  if (-not $page) { $page = @($payload.query.pages) | Where-Object { $_.title -like "*$requestedTitle*" } | Select-Object -First 1 }
  return $page
}

foreach ($city in $cities) {
  $cityDirectory = Join-Path $outputRoot $city.slug
  New-Item -ItemType Directory -Path $cityDirectory -Force | Out-Null
  $titles = @($city.targets | ForEach-Object { [string]$_.wikiTitle } | Where-Object { $_ } | Select-Object -Unique)
  $pageQuery = 'https://zh.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageimages&piprop=name%7Cthumbnail&pithumbsize=1200&titles=' + [uri]::EscapeDataString(($titles -join '|'))
  try { $pagePayload = RequestJson $pageQuery } catch { $pagePayload = $null }
  $files = @()
  if ($pagePayload) {
    foreach ($target in $city.targets) {
      $page = ResolvePage $pagePayload ([string]$target.wikiTitle)
      if ($page -and $page.pageimage) { $files += [string]$page.pageimage }
    }
  }
  $files = @($files | Select-Object -Unique)
  $filePayload = $null
  if ($files.Count) {
    $fileQuery = 'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize&iiurlwidth=1200&titles=' + [uri]::EscapeDataString((@($files | ForEach-Object { "File:$_" }) -join '|'))
    try { $filePayload = RequestJson $fileQuery } catch { $filePayload = $null }
  }
  $assets = @()
  for ($assetIndex = 0; $assetIndex -lt $city.targets.Count; $assetIndex += 1) {
    $target = $city.targets[$assetIndex]
    try {
      if (-not $pagePayload -or -not $filePayload) { throw 'Metadata request unavailable' }
      $page = ResolvePage $pagePayload ([string]$target.wikiTitle)
      if (-not $page -or -not $page.pageimage) { throw 'No encyclopedia page image' }
      $filePage = @($filePayload.query.pages) | Where-Object { $_.title -eq "File:$($page.pageimage)" } | Select-Object -First 1
      $info = @($filePage.imageinfo)[0]
      if (-not $info -or -not $info.url -or -not $info.descriptionurl) { throw 'No Commons file metadata' }
      $license = PlainText $info.extmetadata.LicenseShortName.value
      if ($license -notmatch 'CC|public domain|PD|GFDL') { throw 'License is not accepted' }
      if ($used.Contains([string]$info.url)) { throw 'Duplicate image in the same shard' }
      $null = $used.Add([string]$info.url)
      $fileName = ('{0:D2}-{1}.webp' -f ($assetIndex + 1), $target.category)
      $destination = Join-Path $cityDirectory $fileName
      $sourceDestination = "$destination.source"
      $cleanOriginal = ([uri][string]$info.url).GetLeftPart([UriPartial]::Path)
      Invoke-WebRequest -Uri ([string]$info.thumburl) -Headers $headers -OutFile $sourceDestination -TimeoutSec 90 -UseBasicParsing
      if ((Get-Item -LiteralPath $sourceDestination).Length -lt 10000) { throw 'Downloaded image is too small' }
      $author = PlainText $info.extmetadata.Artist.value
      if (-not $author) { $author = 'Wikimedia Commons contributor' }
      $assets += [ordered]@{
        status='licensed'; category=$target.category; subject=$target.subject
        localPath="/cities/media/$($city.slug)/$fileName"; sourcePath="/cities/media/$($city.slug)/$fileName.source"; alt=$target.alt
        title=([string]$filePage.title -replace '^File:', ''); author=$author; sourcePlatform='Wikimedia Commons'
        sourcePage=[string]$info.descriptionurl; originalUrl=$cleanOriginal; license=$license
        licenseUrl=if ($info.extmetadata.LicenseUrl.value) { [string]$info.extmetadata.LicenseUrl.value } else { [string]$info.descriptionurl }
        retrievedAt='2026-08-09'; width=1200; height=800; query="Wikipedia page: $($page.title)"
        matchEvidence="The image is the page image of the encyclopedia entry: $($page.title)"
      }
    } catch {
      $assets += [pscustomobject]@{ status='missing'; category=$target.category; subject=$target.subject; alt=$target.alt; reason=$_.Exception.Message }
    }
  }
  $result.cities[$city.slug] = [ordered]@{ city=$city.city; assets=$assets }
  $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
  $licensed = @($assets | Where-Object status -eq 'licensed').Count
  Write-Output "[$Shard] $($city.city): $licensed/$($city.targets.Count)"
}

$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
Write-Output "Shard $Shard complete: $($cities.Count) cities"
