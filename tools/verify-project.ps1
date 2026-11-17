[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gameFailures = [Collections.Generic.List[string]]::new()
$gameScripts = @(Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1' -File)
foreach ($file in $gameScripts) {
    $tokens = $null
    $parseErrors = $null
    [void][Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$parseErrors)
    foreach ($parseError in $parseErrors) { $gameFailures.Add("$($file.Name): $($parseError.Message)") }
}

$manifest = Get-Content -LiteralPath (Join-Path $gameRoot 'skills-provenance.json') -Raw | ConvertFrom-Json
$fileCount = 0
foreach ($skill in $manifest.skills) {
    foreach ($file in $skill.files) {
        $filePath = [IO.Path]::GetFullPath((Join-Path (Join-Path $gameRoot $skill.path) $file.path))
        if (-not $filePath.StartsWith($gameRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
            $gameFailures.Add("Skill path outside repository: $($skill.name)")
            continue
        }
        if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
            $gameFailures.Add("Missing skill file: $($skill.name)/$($file.path)")
        } elseif ((Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash -ne $file.sha256) {
            $gameFailures.Add("Skill checksum changed: $($skill.name)/$($file.path)")
        }
        $fileCount++
    }
}
foreach ($license in @('android-adb-control','game-design','superpowers','expo')) {
    if (-not (Test-Path -LiteralPath (Join-Path $gameRoot "docs/skill-licenses/$license.txt"))) {
        $gameFailures.Add("Missing license record: $license")
    }
}
if ($gameFailures.Count) {
    $gameFailures | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}
Write-Output "OK: $($gameScripts.Count) PowerShell scripts parsed; $fileCount imported files verified across $($manifest.skills.Count) skills; license records present."
