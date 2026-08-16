Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$cityFile = Join-Path $projectRoot 'lib\cities.ts'
$publicDir = Join-Path $projectRoot 'public\cities'
$docsDir = Join-Path $projectRoot 'docs'
$source = Get-Content -LiteralPath $cityFile -Raw -Encoding UTF8
$pattern = 'city:\s*"(?<city>[^"]+)"[\s\S]{0,180}?image:\s*"/cities/(?<image>[^"]+)"[\s\S]{0,420}?hook:\s*"(?<hook>[^"]+)"[\s\S]{0,260}?sights:\s*\["(?<sight1>[^"]+)",\s*"(?<sight2>[^"]+)"'
$matches = [regex]::Matches($source, $pattern)
$newCoverSlugs = @('taiyuan','chengde','changchun','yangzhou','wuxi','huangshan','kaifeng','jingdezhen','zhuhai','nanning')
$palette = @(
  @([Drawing.Color]::FromArgb(88,111,101), [Drawing.Color]::FromArgb(214,204,187)),
  @([Drawing.Color]::FromArgb(97,116,128), [Drawing.Color]::FromArgb(223,215,203)),
  @([Drawing.Color]::FromArgb(133,100,83), [Drawing.Color]::FromArgb(226,211,193)),
  @([Drawing.Color]::FromArgb(98,92,109), [Drawing.Color]::FromArgb(216,211,219))
)

function New-CityPlaceholder([string]$path, [string]$city, [string]$landmark, [string]$hook, [int]$index) {
  $width = 1440
  $height = 960
  $bitmap = [Drawing.Bitmap]::new($width, $height)
  $graphics = [Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $colors = $palette[$index % $palette.Count]
  $rect = [Drawing.Rectangle]::new(0, 0, $width, $height)
  $brush = [Drawing.Drawing2D.LinearGradientBrush]::new($rect, $colors[0], $colors[1], 28)
  $graphics.FillRectangle($brush, $rect)
  $veil = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(65, 247, 242, 232))
  $graphics.FillEllipse($veil, -180, 420, 980, 720)
  $graphics.FillEllipse($veil, 850, -220, 760, 650)
  $linePen = [Drawing.Pen]::new([Drawing.Color]::FromArgb(95, 255, 255, 255), 3)
  $graphics.DrawLine($linePen, 110, 190, 1330, 190)
  $graphics.DrawLine($linePen, 110, 775, 1330, 775)
  $cityFont = [Drawing.Font]::new('Microsoft YaHei', 108, [Drawing.FontStyle]::Bold)
  $landmarkFont = [Drawing.Font]::new('Microsoft YaHei', 36, [Drawing.FontStyle]::Regular)
  $smallFont = [Drawing.Font]::new('Microsoft YaHei', 21, [Drawing.FontStyle]::Regular)
  $white = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(246, 246, 241, 232))
  $muted = [Drawing.SolidBrush]::new([Drawing.Color]::FromArgb(205, 246, 241, 232))
  $graphics.DrawString($city, $cityFont, $white, 104, 255)
  $graphics.DrawString($landmark, $landmarkFont, $white, 112, 425)
  $graphics.DrawString($hook, $smallFont, $muted, 114, 510)
  $graphics.DrawString('CITY-SPECIFIC VISUAL PLACEHOLDER', $smallFont, $muted, 114, 710)
  $encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
  $parameters = [Drawing.Imaging.EncoderParameters]::new(1)
  $parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, 88L)
  $bitmap.Save($path, $encoder, $parameters)
  $parameters.Dispose(); $cityFont.Dispose(); $landmarkFont.Dispose(); $smallFont.Dispose(); $white.Dispose(); $muted.Dispose(); $linePen.Dispose(); $veil.Dispose(); $brush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

$records = @()
$index = 0
foreach ($match in $matches) {
  $city = $match.Groups['city'].Value
  $imageName = $match.Groups['image'].Value
  $slug = [IO.Path]::GetFileNameWithoutExtension($imageName)
  $hook = $match.Groups['hook'].Value
  $sight1 = $match.Groups['sight1'].Value
  $sight2 = $match.Groups['sight2'].Value
  if ($newCoverSlugs -contains $slug) {
    $coverPath = Join-Path $publicDir "$slug.jpg"
    New-CityPlaceholder $coverPath $city $sight1 $hook $index
    $records += [pscustomobject]@{ city=$city; slug=$slug; role='cover'; local_path="/cities/$slug.jpg"; title="$city · $sight1 城市专属视觉占位"; author='旅策'; source_page='internal://city-placeholder'; license='旅策自有视觉占位'; retrieved_at='2026-08-09' }
  }
  foreach ($detail in @(@('detail-1',$sight1), @('detail-2',$sight2))) {
    $fileName = "$slug-$($detail[0]).jpg"
    New-CityPlaceholder (Join-Path $publicDir $fileName) $city $detail[1] $hook ($index + [array]::IndexOf(@('detail-1','detail-2'), $detail[0]) + 1)
    $records += [pscustomobject]@{ city=$city; slug=$slug; role=$detail[0]; local_path="/cities/$fileName"; title="$city · $($detail[1]) 城市专属视觉占位"; author='旅策'; source_page='internal://city-placeholder'; license='旅策自有视觉占位'; retrieved_at='2026-08-09' }
  }
  $index++
}

$csvPath = Join-Path $docsDir 'image-sources.csv'
$records | Export-Csv -LiteralPath $csvPath -NoTypeInformation -Encoding utf8
$records | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $docsDir 'city-placeholder-manifest.json') -Encoding utf8
Write-Output "Generated $($records.Count) city-specific placeholder images for $($matches.Count) cities."
