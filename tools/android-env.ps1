[CmdletBinding()]
param()

$gameLocalConfig = Join-Path $PSScriptRoot '../.local/android.json'
$gameConfig = if (Test-Path -LiteralPath $gameLocalConfig) {
    Get-Content -LiteralPath $gameLocalConfig -Raw | ConvertFrom-Json
} else { $null }

$gameSdkCandidates = @(
    $gameConfig.sdkRoot
    $env:ANDROID_HOME
    $env:ANDROID_SDK_ROOT
    [Environment]::GetEnvironmentVariable('ANDROID_HOME', 'User')
    (Join-Path $env:LOCALAPPDATA 'RepForgeAndroid')
    (Join-Path $env:LOCALAPPDATA 'Android/Sdk')
) | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'platform-tools/adb.exe')) }
if (-not $gameSdkCandidates) { throw 'Android SDK not found. Set ANDROID_HOME or .local/android.json sdkRoot.' }
$env:ANDROID_HOME = [IO.Path]::GetFullPath(@($gameSdkCandidates)[0])
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

$gameJavaCandidates = @(
    $gameConfig.javaHome
    $env:JAVA_HOME
    [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
) | Where-Object { $_ -and (Test-Path -LiteralPath (Join-Path $_ 'bin/java.exe')) }
if (-not $gameJavaCandidates) { throw 'JDK not found. Set JAVA_HOME or .local/android.json javaHome.' }
$env:JAVA_HOME = [IO.Path]::GetFullPath(@($gameJavaCandidates)[0])

$gameToolPaths = @(
    (Join-Path $env:JAVA_HOME 'bin')
    (Join-Path $env:ANDROID_HOME 'platform-tools')
    (Join-Path $env:ANDROID_HOME 'cmdline-tools/latest/bin')
    (Join-Path $env:ANDROID_HOME 'emulator')
)
$env:PATH = (($gameToolPaths + ($env:PATH -split [IO.Path]::PathSeparator)) |
    Select-Object -Unique) -join [IO.Path]::PathSeparator
Write-Verbose "SDK: $env:ANDROID_HOME; JDK: $env:JAVA_HOME (current process only)"
