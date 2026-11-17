[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
Push-Location $gameRoot
try {
    . (Join-Path $PSScriptRoot 'android-env.ps1')
    & npm run android:sync
    if ($LASTEXITCODE -ne 0) { throw 'Web build or Capacitor sync failed.' }
    Push-Location (Join-Path $gameRoot 'android')
    try {
        if ($IsWindows) { & ./gradlew.bat assembleDebug --console=plain }
        else { & sh ./gradlew assembleDebug --console=plain }
        if ($LASTEXITCODE -ne 0) { throw 'Android debug build failed.' }
    } finally { Pop-Location }
    $gameApk = Join-Path $gameRoot 'android/app/build/outputs/apk/debug/app-debug.apk'
    & (Join-Path $PSScriptRoot 'inspect-apk.ps1') -ApkPath $gameApk
    if ($LASTEXITCODE -ne 0) { throw 'APK inspection failed.' }
} finally { Pop-Location }
