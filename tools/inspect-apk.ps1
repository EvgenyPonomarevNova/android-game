[CmdletBinding()]
param([Parameter(Mandatory)][string]$ApkPath)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'android-env.ps1')
$gameApk = Get-Item -LiteralPath $ApkPath
if ($gameApk.PSIsContainer -or $gameApk.Extension -ne '.apk') { throw 'Specify an existing .apk file.' }
$gameBuildTools = Join-Path $env:ANDROID_HOME 'build-tools/36.0.0'
if (-not (Test-Path -LiteralPath "$gameBuildTools/apksigner.bat")) { throw 'Android Build Tools 36.0.0 is missing.' }

& "$gameBuildTools/apksigner.bat" verify --verbose --print-certs $gameApk.FullName
if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
$gameBadging = & "$gameBuildTools/aapt2.exe" dump badging $gameApk.FullName
if ($LASTEXITCODE -ne 0) { throw 'APK manifest inspection failed.' }
$gameBadging | Where-Object { $_ -match '^(package:|minSdkVersion:|targetSdkVersion:|launchable-activity:|native-code:)' }
[pscustomobject]@{
    File=$gameApk.FullName
    Bytes=$gameApk.Length
    SHA256=(Get-FileHash -LiteralPath $gameApk.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    Signature='Verified by apksigner; not a device test or release approval'
} | Format-List
