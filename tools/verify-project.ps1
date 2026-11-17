[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$gameRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$gameFailures = [Collections.Generic.List[string]]::new()
$gameScripts = @(Get-ChildItem -LiteralPath $PSScriptRoot,(Join-Path $gameRoot 'tests') -Filter '*.ps1' -File -Recurse)
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

# Inspect only tracked/staged paths, never private local configuration contents.
$trackedOutput = & git -C $gameRoot ls-files -z
if ($LASTEXITCODE -ne 0) { throw 'Unable to inspect the Git index.' }
$trackedFiles = ($trackedOutput -join "`n") -split "`0" | Where-Object { $_ }
foreach ($relativePath in $trackedFiles) {
    $privateDirectory = $relativePath -match '(^|/)(\.local|node_modules|\.gradle|\.godot|\.expo|Library|Temp|artifacts|exports)(/|$)'
    $privateFile = ($relativePath -match '(^|/)\.env(\..+)?$' -and $relativePath -notmatch '(^|/)\.env\.example$') -or
        $relativePath -match '\.(jks|keystore|p12|pem|key|pfx|p8|apk|aab|apks|zip|7z)$' -or
        $relativePath -match '(^|/)(local\.properties|credentials\.json|google-services\.json)$'
    if ($privateDirectory -or $privateFile) { $gameFailures.Add("Private or generated file tracked by Git: $relativePath") }
    $trackedPath = Join-Path $gameRoot $relativePath
    if ((Test-Path -LiteralPath $trackedPath -PathType Leaf) -and (Get-Item -LiteralPath $trackedPath).Length -gt 10MB) {
        # LFS may expand a small Git pointer into a large local working file.
        $indexedSize = & git -C $gameRoot cat-file -s ":$relativePath"
        if ($LASTEXITCODE -ne 0) { throw "Unable to inspect indexed file size: $relativePath" }
        if ([long]$indexedSize -gt 10MB) {
            $gameFailures.Add("File exceeds 10 MiB; use Git LFS or external storage: $relativePath")
        }
    }
}
if ($gameFailures.Count) {
    $gameFailures | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}
Write-Output "OK: $($gameScripts.Count) PowerShell scripts parsed; $fileCount imported files verified across $($manifest.skills.Count) skills; license records present; $($trackedFiles.Count) Git paths checked."
