[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$checker = Join-Path $PSScriptRoot '../tools/check-commit-message.ps1'
$valid = @(
    'feat(gameplay): add touch movement'
    'fix: preserve saved progress'
    'refactor(save)!: replace the save format'
    'ci(deps): bump actions/checkout from 7.0.0 to 7.0.1'
    ('docs: ' + ('a' * 66))
)
$invalid = @(
    ''
    'update stuff'
    'Fix: preserve saved progress'
    'feat(gameplay): '
    'fix(save): preserve progress '
    "fix(save): preserve progress`nextra line"
    ('docs: ' + ('a' * 67))
)
foreach ($message in $valid) { & $checker -Message $message | Out-Null }
foreach ($message in $invalid) {
    $rejected = $false
    try { & $checker -Message $message | Out-Null } catch { $rejected = $true }
    if (-not $rejected) { throw "Invalid commit subject was accepted: $message" }
}
Write-Output "OK: $($valid.Count) valid and $($invalid.Count) invalid commit subjects checked."
