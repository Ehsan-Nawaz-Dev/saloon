
Add-Type -AssemblyName System.Drawing

$inputPath = "C:/Users/Ehsan Nawaz/.gemini/antigravity/brain/3ddf4a0c-3cfd-4701-a8ca-d96bb9c3ef76/uploaded_media_1769446716742.jpg"
$outputPath = "d:\saloon\mono_logo_fixed.png"
$base64Path = "d:\saloon\new_logo_mono_base64.txt"
$targetWidth = 384

if (Test-Path $inputPath) {
    $img = [System.Drawing.Image]::FromFile($inputPath)
    $ratio = $img.Height / $img.Width
    $targetHeight = [int]($targetWidth * $ratio)
    
    # 1. Resize high quality
    $bmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $targetWidth, $targetHeight)
    
    
    # 2. Thresholding
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        for ($y = 0; $y -lt $bmp.Height; $y++) {
            $c = $bmp.GetPixel($x, $y)
            if ($c.GetBrightness() -lt 0.90) {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::Black)
            } else {
                $bmp.SetPixel($x, $y, [System.Drawing.Color]::White)
            }
        }
    }
    
    # 3. Add Rounded Border
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::Black, 8)
    $radius = 50
    $d = $radius * 2
    # Inset slightly to ensure border is visible
    $rectX = 4
    $rectY = 4
    $rectW = $targetWidth - 8
    $rectH = $targetHeight - 8
    
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($rectX, $rectY, $d, $d, 180, 90)
    $path.AddArc($rectX + $rectW - $d, $rectY, $d, $d, 270, 90)
    $path.AddArc($rectX + $rectW - $d, $rectY + $rectH - $d, $d, $d, 0, 90)
    $path.AddArc($rectX, $rectY + $rectH - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    
    $graph.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graph.DrawPath($pen, $path)
    
    $graph.Dispose()
    $img.Dispose()
    
    # 4. Save
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $path.Dispose()
    $pen.Dispose()

    # Convert to Base64
    $bytes = [System.IO.File]::ReadAllBytes($outputPath)
    $base64 = [Convert]::ToBase64String($bytes)
    $base64 | Out-File $base64Path -Encoding ascii -NoNewline
    
    Write-Host "Success: Processed logo with border. Size: $($targetWidth)x$($targetHeight)"
} else {
    Write-Host "Input file not found"
}
