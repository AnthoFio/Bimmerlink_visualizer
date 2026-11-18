<#
.SYNOPSIS
Sets the Status field of the GitHub project board for one or more issues.

.DESCRIPTION
Moves issues of AnthoFio/Bimmerlink_visualizer on project 7 (owner AnthoFio) to a Status column
(Backlog > Ready > In progress > In review > Done). Whoever takes over or hands on a ticket runs this
themselves; see "Story workflow" in AGENTS.md and docs/process/labels-and-board.md.

Requires the GitHub CLI (gh), signed in, with the `project` scope:
    gh auth refresh -s project
The issue must already be an item of the project (it is, if it was added to the board).

.PARAMETER Issue
One or more issue numbers, for example 5 or 5,8.

.PARAMETER Status
Target column: Backlog, Ready, "In progress", "In review" or Done.

.EXAMPLE
powershell -File scripts/set-project-status.ps1 -Issue 5 -Status "In progress"

.EXAMPLE
powershell -File scripts/set-project-status.ps1 -Issue 5,8 -Status Done
#>
param(
  [Parameter(Mandatory = $true)][int[]]$Issue,
  [Parameter(Mandatory = $true)][ValidateSet('Backlog', 'Ready', 'In progress', 'In review', 'Done')][string]$Status
)

$ErrorActionPreference = 'Stop'

# Project 7 (owner AnthoFio): node id, the single-select field `Status` and its option ids.
# If the board's Status field is ever recreated, look the ids up with:
#   gh project field-list 7 --owner AnthoFio --format json
$projectId = 'PVT_kwHOAIlJ5M4BsO6_'
$fieldId = 'PVTSSF_lAHOAIlJ5M4BsO6_zhqd_dY'
$options = @{
  'Backlog'     = 'f75ad846'
  'Ready'       = 'e18bf179'
  'In progress' = '47fc9ee4'
  'In review'   = 'aba860b9'
  'Done'        = '98236657'
}

$items = (gh project item-list 7 --owner AnthoFio --limit 200 --format json | ConvertFrom-Json).items
foreach ($n in $Issue) {
  $item = $items |
    Where-Object { $_.content.number -eq $n -and $_.content.repository -eq 'AnthoFio/Bimmerlink_visualizer' } |
    Select-Object -First 1
  if (-not $item) { throw "Issue #$n not found in project 7" }
  gh project item-edit --id $item.id --project-id $projectId --field-id $fieldId --single-select-option-id $options[$Status] | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "item-edit failed for #$n" }
  "#$n -> $Status"
}
