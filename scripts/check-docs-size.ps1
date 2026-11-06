# Report project docs that exceed their line limits (see CLAUDE.md "Token 節省").
$root = Split-Path -Parent $PSScriptRoot
$limits = [ordered]@{
    'CLAUDE.md'                = 150
    'Progress.md'              = 120
    '1-Plans\2-滾動式計畫.md'   = 200
}

$over = 0
foreach ($rel in $limits.Keys) {
    $path = Join-Path $root $rel
    if (-not (Test-Path $path)) { continue }
    $lines = (Get-Content -Path $path -Encoding UTF8 | Measure-Object -Line).Lines
    $limit = $limits[$rel]
    if ($lines -gt $limit) {
        Write-Host ("[OVER] {0}: {1}/{2} lines -> archive now" -f $rel, $lines, $limit) -ForegroundColor Red
        $over++
    } else {
        Write-Host ("[OK]   {0}: {1}/{2} lines" -f $rel, $lines, $limit)
    }
}
exit $over
