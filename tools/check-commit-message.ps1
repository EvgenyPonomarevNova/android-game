[CmdletBinding()]
param([Parameter(Mandatory)][AllowEmptyString()][string]$Message)

$pattern = '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9][a-z0-9./-]*\))?!?: \S(?:.*\S)?$'
if ($Message.Length -gt 72 -or $Message -match '[\x00-\x1f\x7f]' -or $Message -cnotmatch $pattern) {
    throw 'Use a Conventional Commit subject up to 72 characters: type(scope): imperative summary. Whitespace at either end and control characters are not allowed.'
}
Write-Output "OK: $Message"
