Get-ChildItem -Path "src" -Recurse -Include "*.tsx","*.ts" | ForEach-Object {
    $file = $_.FullName
    $raw = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
    $updated = $raw.Replace("US`$", "RD`$")
    if ($raw -ne $updated) {
        [System.IO.File]::WriteAllText($file, $updated, [System.Text.Encoding]::UTF8)
        Write-Host "Reverted: $($_.Name)"
    }
}
Write-Host "Done."
