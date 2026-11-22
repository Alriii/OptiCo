param(
    [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$failed = @()

function Run-Step {
    param($Name, $WorkDir, $Command)

    Write-Host ""
    Write-Host "== $Name ==" -ForegroundColor Cyan
    Push-Location $WorkDir
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) { throw "$Name failed" }
    }
    catch {
        $script:failed += $Name
        Write-Host "FAILED: $Name" -ForegroundColor Red
    }
    finally {
        Pop-Location
    }
}

foreach ($app in @("backend", "frontend")) {
    $dir = Join-Path $root $app
    if (-not $SkipInstall) {
        Run-Step "$app install" $dir "npm ci"
    }
    Run-Step "$app lint" $dir "npm run lint"
    Run-Step "$app types" $dir "npx tsc --noEmit"
    Run-Step "$app test" $dir "npm test"
    Run-Step "$app build" $dir "npm run build"
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All checks passed." -ForegroundColor Green
    exit 0
}

Write-Host "Failed: $($failed -join ', ')" -ForegroundColor Red
exit 1
