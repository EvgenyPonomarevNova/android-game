<#
.SYNOPSIS
Bounded preflight for NeRazley; diagnostics are opt-in and stored outside Git.
.DESCRIPTION
Requires PowerShell 7 and an explicitly approved device and Android user.
Does not boot/wait for devices, clear data/logs, change settings, or retry actions.
InstallApk and Launch are explicit mutations. DryRun never invokes SDK tools.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9][A-Za-z0-9._:\-]*$')][string]$Serial,
    [Parameter(Mandatory)][ValidateRange(0, 21474)][int]$UserId,
    [string]$InstallApk,
    [switch]$Launch,
    [switch]$CollectDiagnostics,
    [string]$OutputDirectory,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
# Deliberately limited to this game; do not accept arbitrary app targets.
$gamePackage = 'com.nerazley.game'

function Assert-GameOutputPath {
    param([string]$Path)
    if (-not $Path -or -not [IO.Path]::IsPathFullyQualified($Path)) {
        throw 'Diagnostics require an absolute OutputDirectory outside any Git checkout.'
    }
    $fullPath = [IO.Path]::GetFullPath($Path)
    if ($fullPath -eq $gameRoot -or $fullPath.StartsWith($gameRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Diagnostics must be outside the game repository, including .local.'
    }
    $ancestor = $fullPath
    while ($ancestor) {
        if (Test-Path -LiteralPath $ancestor) {
            $item = Get-Item -LiteralPath $ancestor -Force
            if (-not $item.PSIsContainer -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
                throw 'OutputDirectory must use real directories without symlinks/junctions.'
            }
            if (Test-Path -LiteralPath (Join-Path $ancestor '.git')) {
                throw 'Diagnostics must be outside any Git checkout.'
            }
        }
        $ancestor = [IO.Path]::GetDirectoryName($ancestor)
    }
    return $fullPath
}

if ($OutputDirectory -and -not $CollectDiagnostics) { throw 'OutputDirectory requires CollectDiagnostics.' }
if ($CollectDiagnostics) { $gameOutputRoot = Assert-GameOutputPath $OutputDirectory }
if ($InstallApk) {
    if (-not (Test-Path -LiteralPath $InstallApk -PathType Leaf) -or [IO.Path]::GetExtension($InstallApk) -ne '.apk') {
        throw 'InstallApk must name an existing APK file.'
    }
    $InstallApk = (Resolve-Path -LiteralPath $InstallApk).Path
}
if ($DryRun) {
    [pscustomobject]@{
        mode = 'dry-run'; package = $gamePackage; serial = $Serial; userId = $UserId
        install = [bool]$InstallApk; launch = [bool]$Launch; diagnostics = [bool]$CollectDiagnostics
        outputDirectory = $OutputDirectory; sdkInvoked = $false
    }
    return
}

. (Join-Path $PSScriptRoot 'android-env.ps1')
$gameAdb = Join-Path $env:ANDROID_HOME 'platform-tools/adb.exe'

function Invoke-GameProcess {
    param([string]$File, [string[]]$Arguments, [int]$TimeoutSeconds = 15)
    $start = [Diagnostics.ProcessStartInfo]::new($File)
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    foreach ($argument in $Arguments) { $start.ArgumentList.Add($argument) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $start
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
            # Kill only this timed-out client, never a shared ADB server/process tree.
            $process.Kill()
            throw 'SDK client timed out. Any attempted mutation has UNKNOWN status; inspect before retrying.'
        }
        $result = $stdout.GetAwaiter().GetResult().Trim()
        $errorText = $stderr.GetAwaiter().GetResult().Trim()
        if ($process.ExitCode -ne 0) { throw "SDK command failed ($($process.ExitCode)): $errorText $result" }
        return $result
    } finally { $process.Dispose() }
}

function Invoke-GameAdb {
    param([string[]]$AdbArguments, [int]$TimeoutSeconds = 15)
    return Invoke-GameProcess -File $gameAdb -Arguments (@('-s', $Serial) + $AdbArguments) -TimeoutSeconds $TimeoutSeconds
}

function Assert-GameUser {
    $currentUser = Invoke-GameAdb @('shell', 'am', 'get-current-user')
    if ($currentUser -notmatch '^\d+$' -or [int]$currentUser -ne $UserId) {
        throw 'Foreground Android user differs from the explicit UserId. Stop; do not switch users automatically.'
    }
}

function Get-GameUid {
    $packages = Invoke-GameAdb @('shell', 'cmd', 'package', 'list', 'packages', '--user', "$UserId", '-U', $gamePackage)
    $match = [regex]::Match($packages, '(?m)^package:' + [regex]::Escape($gamePackage) + ' uid:(\d+)\s*$')
    if (-not $match.Success) { throw 'Game package/UID not found for the selected Android user.' }
    $uid = [int]$match.Groups[1].Value
    if ([math]::Floor($uid / 100000) -ne $UserId) { throw 'Package UID does not belong to the selected Android user.' }
    return $uid
}

function Get-GameProcessId {
    # Keep only the exact game main process for the selected UID; never export the process list.
    $rows = Invoke-GameAdb @('shell', 'ps', '-A', '-o', 'UID,PID,NAME')
    $matchingRows = @($rows -split '\r?\n' | Where-Object {
        $_ -match ('^\s*' + $gameUid + '\s+\d+\s+' + [regex]::Escape($gamePackage) + '\s*$')
    })
    if ($matchingRows.Count -ne 1) { throw 'Expected one running game main process for the selected UID; no diagnostic fallback to other apps.' }
    return [int](($matchingRows[0].Trim() -split '\s+')[1])
}

if ((Invoke-GameAdb @('get-state')) -ne 'device') { throw 'Selected ADB transport is not ready.' }
if ((Invoke-GameAdb @('shell', 'getprop', 'sys.boot_completed')) -ne '1') { throw 'Android is not booted; no wait or automatic emulator launch.' }
Assert-GameUser

$gameInstallStatus = 'not requested'
if ($InstallApk) {
    # Verify APK identity before invoking install; no downgrade/test/permission-grant flags.
    $aapt = Get-ChildItem -LiteralPath (Join-Path $env:ANDROID_HOME 'build-tools') -Filter aapt2.exe -Recurse -File |
        Sort-Object FullName -Descending | Select-Object -First 1
    if (-not $aapt) { throw 'aapt2 is required to verify the APK package before installation.' }
    $badging = Invoke-GameProcess -File $aapt.FullName -Arguments @('dump', 'badging', $InstallApk)
    if ($badging -notmatch ("(?m)^package: name='" + [regex]::Escape($gamePackage) + "' ")) {
        throw 'Refusing to install an APK whose package differs from the game.'
    }
    Assert-GameUser
    $gameInstallStatus = Invoke-GameAdb -AdbArguments @('install', '--user', "$UserId", '-r', $InstallApk) -TimeoutSeconds 60
    if ($gameInstallStatus -notmatch '(?m)^Success\s*$') { throw "Install not confirmed: $gameInstallStatus" }
}
$gameUid = Get-GameUid
$gameLaunchStatus = 'not requested'
if ($Launch) {
    Assert-GameUser
    $resolved = Invoke-GameAdb @('shell', 'cmd', 'package', 'resolve-activity', '--brief', '--user', "$UserId", '-a', 'android.intent.action.MAIN', '-c', 'android.intent.category.LAUNCHER', $gamePackage)
    $component = @($resolved -split '\r?\n' | Where-Object { $_ -match ('^' + [regex]::Escape($gamePackage) + '/[A-Za-z0-9_.]+$') })
    if ($component.Count -ne 1) { throw 'Unable to resolve one safe launcher component for the game.' }
    Assert-GameUser
    $gameLaunchStatus = Invoke-GameAdb @('shell', 'am', 'start', '--user', "$UserId", '-W', '-n', $component[0])
    if ($gameLaunchStatus -notmatch '(?m)^Status: ok\s*$') { throw "Launch not confirmed: $gameLaunchStatus" }
}
Assert-GameUser
$gameUid = Get-GameUid

if ($CollectDiagnostics) {
    $gameProcessId = Get-GameProcessId
    # Revalidate the path immediately before creating a unique, non-overwriting session.
    $gameOutputRoot = Assert-GameOutputPath $gameOutputRoot
    $sessionPath = Join-Path $gameOutputRoot ("smoke-{0}-{1}" -f (Get-Date -Format 'yyyyMMdd-HHmmss'), [guid]::NewGuid().ToString('N'))
    [void](New-Item -ItemType Directory -Path $sessionPath)
    $diagnostics = [ordered]@{
        'logcat-main.txt' = @('logcat', "--pid=$gameProcessId", "--uid=$gameUid", '-d', '-t', '600', '-v', 'threadtime')
        'gfxinfo-main.txt' = @('shell', 'dumpsys', 'gfxinfo', "$gameProcessId", 'framestats')
        'meminfo-main.txt' = @('shell', 'dumpsys', 'meminfo', "$gameProcessId")
    }
    foreach ($entry in $diagnostics.GetEnumerator()) {
        Assert-GameUser
        if ((Get-GameProcessId) -ne $gameProcessId) { throw 'Game process changed; keep partial artifacts and start a separate observation.' }
        $content = Invoke-GameAdb $entry.Value
        Set-Content -LiteralPath (Join-Path $sessionPath $entry.Key) -Value $content -Encoding utf8NoBOM
    }
    Assert-GameUser
    if ((Get-GameProcessId) -ne $gameProcessId) { throw 'Game process changed during capture; diagnostics are partial.' }
    [ordered]@{
        capturedAtUtc = [DateTime]::UtcNow.ToString('o'); serial = $Serial; userId = $UserId
        package = $gamePackage; uid = $gameUid; processId = $gameProcessId
        install = $gameInstallStatus; launch = $gameLaunchStatus
        scope = 'main process only; renderer/system crash logs are not collected'
        verdict = 'preflight only; UI, lifecycle, offline, multitouch and frame time require separate verification'
    } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $sessionPath 'preflight.json') -Encoding utf8NoBOM
    Write-Output "Diagnostics: $sessionPath"
}
Write-Output 'OK: selected transport, boot, Android user and game package checked. Gameplay/device acceptance is not established.'
