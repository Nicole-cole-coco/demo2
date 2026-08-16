param(
  [int]$Shard = 0,
  [int]$ShardCount = 5,
  [int]$MaxTargets = 20
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$targetsPath = Join-Path $projectRoot 'docs\city-media-targets.json'
$outputRoot = Join-Path $projectRoot 'public\cities\media'
$manifestPath = Join-Path $projectRoot "content\cities\media-shard-$Shard.json"
$requestHeaders = @{ 'User-Agent' = 'LvceTravelPlanner/1.0 (open-license city media curation)' }
$targets = Get-Content -LiteralPath $targetsPath -Raw -Encoding UTF8 | ConvertFrom-Json
$cities = @()
for ($index = 0; $index -lt $targets.cities.Count; $index += 1) {
  if (($index % $ShardCount) -eq $Shard) { $cities += $targets.cities[$index] }
}
$used = [Collections.Generic.HashSet[string]]::new()
$result = [ordered]@{ generatedAt='2026-08-09'; shard=$Shard; shardCount=$ShardCount; cities=[ordered]@{} }

function PlainText([string]$value) {
  if (-not $value) { return '' }
  return ([Net.WebUtility]::HtmlDecode(($value -replace '<[^>]+>', ' ')) -replace '\s+', ' ').Trim()
}

function CommonsSearch([string]$query) {
  $parameters = 'action=query&generator=search&gsrsearch=' + [uri]::EscapeDataString("$query filetype:bitmap") + '&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url%7Cextmetadata%7Cmime%7Csize&iiurlwidth=1200&format=json&formatversion=2'
  $uri = "https://commons.wikimedia.org/w/api.php?$parameters"
  for ($attempt = 1; $attempt -le 3; $attempt += 1) {
    try {
      return Invoke-RestMethod -Uri $uri -Headers $requestHeaders -TimeoutSec 60
    } catch {
      if ($attempt -eq 3) { throw }
      if ($_.Exception.Message -match '429') { Start-Sleep -Seconds (3 * $attempt) }
      else { Start-Sleep -Seconds $attempt }
    }
  }
}

function FindCandidate($target) {
  $query = @($target.queries)[0]
  $payload = CommonsSearch $query
  foreach ($page in @($payload.query.pages)) {
    $info = @($page.imageinfo)[0]
    if (-not $info -or -not $info.thumburl -or -not $info.descriptionurl) { continue }
    if ($info.mime -notmatch '^image/(jpeg|png|webp)$') { continue }
    $license = PlainText $info.extmetadata.LicenseShortName.value
    $description = PlainText $info.extmetadata.ImageDescription.value
    if ($license -notmatch 'CC|public domain|PD|GFDL') { continue }
    if ($page.title -match 'map|logo|icon|diagram|poster|screenshot') { continue }
    if ($used.Contains([string]$info.url)) { continue }
    return [pscustomobject]@{ page=$page; info=$info; query=$query; description=$description; license=$license }
  }
  return $null
}

foreach ($city in $cities) {
  $cityDirectory = Join-Path $outputRoot $city.slug
  New-Item -ItemType Directory -Path $cityDirectory -Force | Out-Null
  $assets = @()
  $cityTargets = @($city.targets | Select-Object -First $MaxTargets)
  for ($assetIndex = 0; $assetIndex -lt $cityTargets.Count; $assetIndex += 1) {
    $target = $cityTargets[$assetIndex]
    try {
      $found = FindCandidate $target
      if (-not $found) {
        $assets += [pscustomobject]@{ status='missing'; category=$target.category; subject=$target.subject; alt=$target.alt; reason='No open-license match found' }
        continue
      }
      $null = $used.Add([string]$found.info.url)
      $fileName = ('{0:D2}-{1}.webp' -f ($assetIndex + 1), $target.category)
      $destination = Join-Path $cityDirectory $fileName
      $cleanOriginal = ([uri][string]$found.info.url).GetLeftPart([UriPartial]::Path)
      $sourceDestination = "$destination.source"
      Invoke-WebRequest -Uri ([string]$found.info.thumburl) -Headers $requestHeaders -OutFile $sourceDestination -TimeoutSec 90 -UseBasicParsing
      $file = Get-Item -LiteralPath $sourceDestination
      if ($file.Length -lt 10000) { throw 'Downloaded image is too small' }
      $meta = $found.info.extmetadata
      $author = PlainText $meta.Artist.value
      if (-not $author) { $author = 'Wikimedia Commons contributor' }
      $assets += [ordered]@{
        status='licensed'; category=$target.category; subject=$target.subject
        localPath="/cities/media/$($city.slug)/$fileName"; sourcePath="/cities/media/$($city.slug)/$fileName.source"; alt=$target.alt
        title=([string]$found.page.title -replace '^File:', '')
        author=$author; sourcePlatform='Wikimedia Commons'
        sourcePage=[string]$found.info.descriptionurl; originalUrl=$cleanOriginal
        license=$found.license; licenseUrl=if ($meta.LicenseUrl.value) { [string]$meta.LicenseUrl.value } else { [string]$found.info.descriptionurl }
        retrievedAt='2026-08-09'; width=1200; height=800; query=$found.query
        matchEvidence="Open-license Wikimedia Commons result for query: $($found.query); manual visual review remains required"
      }
    } catch {
      $assets += [pscustomobject]@{ status='missing'; category=$target.category; subject=$target.subject; alt=$target.alt; reason=$_.Exception.Message }
    }
    Start-Sleep -Milliseconds 180
  }
  $result.cities[$city.slug] = [ordered]@{ city=$city.city; assets=$assets }
  $result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
  $licensed = @($assets | Where-Object status -eq 'licensed').Count
  Write-Output "[$Shard] $($city.city): $licensed/$($city.targets.Count)"
}

$result | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
Write-Output "Shard $Shard complete: $($cities.Count) cities"
