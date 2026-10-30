param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot ".."))
)

Add-Type -AssemblyName System.Drawing

$assets = Join-Path $ProjectRoot "assets"
$store = Join-Path $ProjectRoot "store-assets"
$android = Join-Path $store "android"
$ios = Join-Path $store "ios"
$iosIpad = Join-Path $store "ios-ipad-13"
$tablet7 = Join-Path $store "android-tablet-7"
$tablet10 = Join-Path $store "android-tablet-10"
$desktop = Join-Path $store "desktop"
$xr = Join-Path $store "android-xr"
New-Item -ItemType Directory -Force -Path $android, $ios, $iosIpad, $tablet7, $tablet10, $desktop, $xr | Out-Null
Remove-Item (Join-Path $android "*.png"), (Join-Path $ios "*.png") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $iosIpad "*.png") -Force -ErrorAction SilentlyContinue
Remove-Item (Join-Path $tablet7 "*.png"), (Join-Path $tablet10 "*.png"), (Join-Path $desktop "*.png"), (Join-Path $xr "*.png") -Force -ErrorAction SilentlyContinue

function New-Canvas([int]$width, [int]$height, [string]$color) {
  $bitmap = [System.Drawing.Bitmap]::new($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.ColorTranslator]::FromHtml($color))
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  return @{ Bitmap = $bitmap; Graphics = $graphics }
}

function Save-Png($canvas, [string]$path) {
  $canvas.Graphics.Dispose()
  $canvas.Bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $canvas.Bitmap.Dispose()
}

function Add-ContainedImage($graphics, [System.Drawing.Image]$image, [int]$width, [int]$height, [int]$padding) {
  $availableWidth = $width - ($padding * 2)
  $availableHeight = $height - ($padding * 2)
  $scale = [Math]::Min($availableWidth / $image.Width, $availableHeight / $image.Height)
  $drawWidth = [int]($image.Width * $scale)
  $drawHeight = [int]($image.Height * $scale)
  $x = [int](($width - $drawWidth) / 2)
  $y = [int](($height - $drawHeight) / 2)
  $graphics.DrawImage($image, $x, $y, $drawWidth, $drawHeight)
}

function Add-CroppedImage($graphics, [System.Drawing.Image]$image, [int]$width, [int]$height, [int]$cropTop, [int]$cropBottom) {
  $sourceHeight = $image.Height - $cropTop - $cropBottom
  $source = [System.Drawing.Rectangle]::new(0, $cropTop, $image.Width, $sourceHeight)
  $destination = [System.Drawing.Rectangle]::new(0, 0, $width, $height)
  $graphics.DrawImage($image, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
}

function Add-MarketingScreen($canvas, [System.Drawing.Image]$image, [string]$eyebrow, [string]$headline, [int]$width, [int]$height) {
  $graphics = $canvas.Graphics
  $scale = $width / 1080.0
  $eyebrowFont = [System.Drawing.Font]::new("Arial", [int](25 * $scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $headlineFont = [System.Drawing.Font]::new("Arial", [int](58 * $scale), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#3158C8"))
  $ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#172033"))
  $center = [System.Drawing.StringFormat]::new()
  $center.Alignment = [System.Drawing.StringAlignment]::Center
  $center.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString($eyebrow.ToUpperInvariant(), $eyebrowFont, $blue, [System.Drawing.RectangleF]::new(0, [int](35*$scale), $width, [int](55*$scale)), $center)
  $graphics.DrawString($headline, $headlineFont, $ink, [System.Drawing.RectangleF]::new([int](70*$scale), [int](85*$scale), $width-[int](140*$scale), [int](190*$scale)), $center)

  $frameX = [int](165 * $scale)
  $frameY = [int](300 * $scale)
  $frameWidth = $width - ($frameX * 2)
  $frameHeight = $height - $frameY - [int](55 * $scale)
  $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 23, 32, 51))
  $graphics.FillRectangle($shadowBrush, $frameX+[int](12*$scale), $frameY+[int](16*$scale), $frameWidth, $frameHeight)

  $sourceTop = 54
  $sourceBottom = 110
  $source = [System.Drawing.Rectangle]::new(0, $sourceTop, $image.Width, $image.Height-$sourceTop-$sourceBottom)
  $destination = [System.Drawing.Rectangle]::new($frameX, $frameY, $frameWidth, $frameHeight)
  $graphics.DrawImage($image, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
  $border = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#D6DEEE"), [int](2*$scale))
  $graphics.DrawRectangle($border, $frameX, $frameY, $frameWidth, $frameHeight)

  $eyebrowFont.Dispose(); $headlineFont.Dispose(); $blue.Dispose(); $ink.Dispose(); $center.Dispose(); $shadowBrush.Dispose(); $border.Dispose()
}

function Get-ResultsScreenInEnglish([System.Drawing.Image]$image) {
  $copy = [System.Drawing.Bitmap]::new($image.Width, $image.Height)
  $graphics = [System.Drawing.Graphics]::FromImage($copy)
  $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $background = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#E9F8F1"))
  $ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#172033"))
  $muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#647084"))
  $title = [System.Drawing.Font]::new("Arial", 25, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $body = [System.Drawing.Font]::new("Arial", 23, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.FillRectangle($background, 109, 537, 552, 96)
  $graphics.DrawString("Ready", $title, $ink, 112, 542)
  $graphics.DrawString("Analyse a product to compare offers.", $body, $muted, 112, 579)
  $graphics.Dispose(); $background.Dispose(); $ink.Dispose(); $muted.Dispose(); $title.Dispose(); $body.Dispose()
  return $copy
}

function Add-LandscapeMarketingScreen($canvas, [System.Drawing.Image]$image, [string]$eyebrow, [string]$headline, [int]$width, [int]$height) {
  $graphics = $canvas.Graphics
  $eyebrowFont = [System.Drawing.Font]::new("Arial", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $headlineFont = [System.Drawing.Font]::new("Arial", 76, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $bodyFont = [System.Drawing.Font]::new("Arial", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $blue = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#3158C8"))
  $ink = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#172033"))
  $muted = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#647084"))
  $graphics.DrawString($eyebrow.ToUpperInvariant(), $eyebrowFont, $blue, 110, 235)
  $graphics.DrawString($headline.Replace("`n", " "), $headlineFont, $ink, [System.Drawing.RectangleF]::new(105, 285, 780, 310))
  $graphics.DrawString("Identify products, compare offers and save the ones that matter.", $bodyFont, $muted, [System.Drawing.RectangleF]::new(110, 625, 700, 140))

  $frameX = 1090; $frameY = 70; $frameWidth = 500; $frameHeight = 940
  $shadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(28, 23, 32, 51))
  $graphics.FillRectangle($shadow, $frameX+18, $frameY+18, $frameWidth, $frameHeight)
  $source = [System.Drawing.Rectangle]::new(0, 54, $image.Width, $image.Height-164)
  $destination = [System.Drawing.Rectangle]::new($frameX, $frameY, $frameWidth, $frameHeight)
  $graphics.DrawImage($image, $destination, $source, [System.Drawing.GraphicsUnit]::Pixel)
  $border = [System.Drawing.Pen]::new([System.Drawing.ColorTranslator]::FromHtml("#D6DEEE"), 3)
  $graphics.DrawRectangle($border, $frameX, $frameY, $frameWidth, $frameHeight)

  $eyebrowFont.Dispose(); $headlineFont.Dispose(); $bodyFont.Dispose(); $blue.Dispose(); $ink.Dispose(); $muted.Dispose(); $shadow.Dispose(); $border.Dispose()
}

$logoPath = Join-Path $assets "adaptive-icon.png"
$logo = [System.Drawing.Image]::FromFile($logoPath)

# Android adaptive foreground: the central mark stays inside the mask-safe zone.
$adaptive = New-Canvas 1024 1024 "#00000000"
$adaptive.Graphics.DrawImage($logo, 192, 192, 640, 640)
Save-Png $adaptive (Join-Path $assets "adaptive-icon-safe.png")

# Native launch splash used by Expo on Android and iOS.
$splash = New-Canvas 2048 2048 "#5278E8"
$splash.Graphics.DrawImage($logo, 674, 574, 700, 700)
$font = [System.Drawing.Font]::new("Arial", 104, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$format = [System.Drawing.StringFormat]::new()
$format.Alignment = [System.Drawing.StringAlignment]::Center
$splash.Graphics.DrawString("PriceLens", $font, $brush, [System.Drawing.RectangleF]::new(0, 1330, 2048, 180), $format)
$font.Dispose(); $brush.Dispose(); $format.Dispose()
Save-Png $splash (Join-Path $assets "splash-icon.png")
$logo.Dispose()

# Google Play feature graphic (required by the main store listing).
$feature = New-Canvas 1024 500 "#5278E8"
$featureLogo = [System.Drawing.Image]::FromFile($logoPath)
$feature.Graphics.DrawImage($featureLogo, 90, 85, 330, 330)
$featureTitle = [System.Drawing.Font]::new("Arial", 74, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$featureBody = [System.Drawing.Font]::new("Arial", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$featureWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$featureSoft = [System.Drawing.SolidBrush]::new([System.Drawing.ColorTranslator]::FromHtml("#EAF0FF"))
$feature.Graphics.DrawString("PriceLens", $featureTitle, $featureWhite, 455, 165)
$feature.Graphics.DrawString("Shop with clarity", $featureBody, $featureSoft, 460, 260)
$featureLogo.Dispose(); $featureTitle.Dispose(); $featureBody.Dispose(); $featureWhite.Dispose(); $featureSoft.Dispose()
Save-Png $feature (Join-Path $store "google-play-feature-graphic-1024x500.png")

$screens = @(
  @{ Name = "01-home"; Source = "C:\Users\kelso\AppData\Local\Temp\codex-clipboard-54bc4b97-0bea-4541-992a-2d80076562fc.png"; Eyebrow = "Smart price comparison"; Headline = "Find the best price`nbefore you buy." },
  @{ Name = "02-results"; Source = "C:\Users\kelso\AppData\Local\Temp\codex-clipboard-1ccaca8d-4f37-404a-93e8-3def85484da3.png"; Eyebrow = "Search with confidence"; Headline = "Compare real offers`nin seconds." },
  @{ Name = "03-saved"; Source = "C:\Users\kelso\AppData\Local\Temp\codex-clipboard-91d69c00-aced-4856-b512-24001b93af49.png"; Eyebrow = "Everything in one place"; Headline = "Save products you`nwant to watch." },
  @{ Name = "04-plans"; Source = "C:\Users\kelso\AppData\Local\Temp\codex-clipboard-cb5be02a-2ebe-4f6b-b9af-e354c2732267.png"; Eyebrow = "More ways to save"; Headline = "Unlock price alerts`nwith Premium." },
  @{ Name = "05-profile"; Source = "C:\Users\kelso\AppData\Local\Temp\codex-clipboard-5668f5a5-cff0-45b0-b2d8-ec61915f5dce.jpg"; Eyebrow = "Made for every market"; Headline = "Compare prices in`nyour preferred country." }
)

foreach ($screen in $screens) {
  if (-not (Test-Path $screen.Source)) { continue }
  $source = [System.Drawing.Image]::FromFile($screen.Source)
  $renderSource = if ($screen.Name -eq "02-results") { Get-ResultsScreenInEnglish $source } else { $source }

  $androidCanvas = New-Canvas 1080 1920 "#F4F7FF"
  Add-MarketingScreen $androidCanvas $renderSource $screen.Eyebrow $screen.Headline 1080 1920
  Save-Png $androidCanvas (Join-Path $android "$($screen.Name)-1080x1920.png")

  $iosCanvas = New-Canvas 1242 2688 "#F4F7FF"
  Add-MarketingScreen $iosCanvas $renderSource $screen.Eyebrow $screen.Headline 1242 2688
  Save-Png $iosCanvas (Join-Path $ios "$($screen.Name)-1242x2688.png")

  $iosIpadCanvas = New-Canvas 2048 2732 "#F4F7FF"
  Add-MarketingScreen $iosIpadCanvas $renderSource $screen.Eyebrow $screen.Headline 2048 2732
  Save-Png $iosIpadCanvas (Join-Path $iosIpad "$($screen.Name)-2048x2732.png")

  $tablet7Canvas = New-Canvas 1200 1920 "#F4F7FF"
  Add-MarketingScreen $tablet7Canvas $renderSource $screen.Eyebrow $screen.Headline 1200 1920
  Save-Png $tablet7Canvas (Join-Path $tablet7 "$($screen.Name)-1200x1920.png")

  $tablet10Canvas = New-Canvas 1600 2560 "#F4F7FF"
  Add-MarketingScreen $tablet10Canvas $renderSource $screen.Eyebrow $screen.Headline 1600 2560
  Save-Png $tablet10Canvas (Join-Path $tablet10 "$($screen.Name)-1600x2560.png")

  $landscapeCanvas = New-Canvas 1920 1080 "#F4F7FF"
  Add-LandscapeMarketingScreen $landscapeCanvas $renderSource $screen.Eyebrow $screen.Headline 1920 1080
  Save-Png $landscapeCanvas (Join-Path $desktop "$($screen.Name)-1920x1080.png")

  $xrCanvas = New-Canvas 1920 1080 "#F4F7FF"
  Add-LandscapeMarketingScreen $xrCanvas $renderSource $screen.Eyebrow $screen.Headline 1920 1080
  Save-Png $xrCanvas (Join-Path $xr "$($screen.Name)-1920x1080.png")
  if ($renderSource -ne $source) { $renderSource.Dispose() }
  $source.Dispose()
}

Write-Output "Generated mobile assets in $assets and $store"
