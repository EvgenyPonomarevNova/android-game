[CmdletBinding()]
param([switch]$Full, [switch]$Devices)

$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$checks = [Collections.Generic.List[object]]::new()

function Add-Check([string]$Name, [bool]$Ok, [string]$Detail, [bool]$Required = $true) {
    $checks.Add([pscustomobject]@{name=$Name;ok=$Ok;required=$Required;detail=$Detail})
}

function Invoke-Probe([string]$File, [string[]]$Arguments) {
    $info = [Diagnostics.ProcessStartInfo]::new()
    $info.FileName = $File
    $info.UseShellExecute = $false
    $info.CreateNoWindow = $true
    $info.RedirectStandardOutput = $true
    $info.RedirectStandardError = $true
    foreach ($argument in $Arguments) { $info.ArgumentList.Add($argument) }
    $process = [Diagnostics.Process]::new()
    $process.StartInfo = $info
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        if (-not $process.WaitForExit(20000)) {
            $process.Kill($true)
            return @{ok=$false;text='Timed out after 20 seconds'}
        }
        return @{ok=($process.ExitCode -eq 0);text=($stdout.Result + $stderr.Result).Trim()}
    } catch {
        return @{ok=$false;text=$_.Exception.Message}
    } finally { $process.Dispose() }
}

try {
    . (Join-Path $PSScriptRoot 'android-env.ps1')
    Add-Check 'Android SDK' $true $env:ANDROID_HOME
} catch { Add-Check 'Android SDK/JDK' $false $_.Exception.Message }

$gitProbe = Invoke-Probe 'git' @('--version')
Add-Check 'Git' $gitProbe.ok $gitProbe.text
$javaProbe = Invoke-Probe "$env:JAVA_HOME/bin/java.exe" @('-version')
Add-Check 'Java' $javaProbe.ok (($javaProbe.text -split '\r?\n')[0])
$adbProbe = Invoke-Probe "$env:ANDROID_HOME/platform-tools/adb.exe" @('version')
Add-Check 'ADB' $adbProbe.ok (($adbProbe.text -split '\r?\n')[0])
Add-Check 'Android CLI' (Test-Path -LiteralPath "$env:ANDROID_HOME/cmdline-tools/latest/bin/android.exe") 'cmdline-tools/latest'
Add-Check 'Android Platform' (Test-Path -LiteralPath "$env:ANDROID_HOME/platforms/android-36/android.jar") 'android-36 (preparation baseline; game target pending)'
$gameBuildTools = "$env:ANDROID_HOME/build-tools/36.0.0"
$gameBuildToolsOk = (Test-Path -LiteralPath "$gameBuildTools/apksigner.bat") -and
    (Test-Path -LiteralPath "$gameBuildTools/aapt2.exe") -and
    (Test-Path -LiteralPath "$gameBuildTools/zipalign.exe")
Add-Check 'Android Build Tools' $gameBuildToolsOk '36.0.0'
$avdProbe = Invoke-Probe "$env:ANDROID_HOME/emulator/emulator.exe" @('-list-avds')
Add-Check 'Emulator profiles' ($avdProbe.ok -and -not [string]::IsNullOrWhiteSpace($avdProbe.text)) $avdProbe.text
Add-Check 'Game emulator' ($avdProbe.ok -and ('Game_API31' -in ($avdProbe.text -split '\r?\n'))) 'Game_API31 (separate from fitness app)'
$nodeProbe = Invoke-Probe 'node' @('--version')
Add-Check 'Node (optional)' $nodeProbe.ok $nodeProbe.text $false

if ($Full) {
    $dockerProbe = Invoke-Probe 'docker' @('info','--format','{{.ServerVersion}}')
    Add-Check 'Docker Engine' $dockerProbe.ok $dockerProbe.text
    $composeProbe = Invoke-Probe 'docker' @('compose','version','--short')
    Add-Check 'Docker Compose' $composeProbe.ok $composeProbe.text
    # Capture auth output privately; never print credentials or token metadata.
    $githubProbe = Invoke-Probe 'gh' @('auth','status','--active')
    Add-Check 'GitHub authentication' $githubProbe.ok $(if ($githubProbe.ok) {'Authenticated'} else {'Run gh auth status locally'})
}
if ($Devices) {
    $deviceProbe = Invoke-Probe "$env:ANDROID_HOME/platform-tools/adb.exe" @('devices','-l')
    $deviceCount = @($deviceProbe.text -split '\r?\n' | Where-Object { $_ -match '^\S+\s+device\s' }).Count
    Add-Check 'Connected Android devices' $deviceProbe.ok "Authorized transports: $deviceCount; no device action performed" $false
}

$report = [ordered]@{
    checkedAt=[DateTimeOffset]::UtcNow.ToString('o')
    stage='Tooling preparation; no game build or device test'
    checks=@($checks.ToArray())
}
$localDir = Join-Path $gameRoot '.local'
New-Item -ItemType Directory -Force -Path $localDir | Out-Null
$report | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $localDir 'environment.json') -Encoding utf8
$checks | Format-Table @{Label='Status';Expression={if ($_.ok) {'OK'} elseif ($_.required) {'FAIL'} else {'OPTIONAL'}}},name,detail -Wrap
if (@($checks | Where-Object { $_.required -and -not $_.ok }).Count) { exit 1 }
