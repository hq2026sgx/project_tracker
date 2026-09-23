<#
    Pushes the Project Tracker repo to https://github.com/hq2026sgx/project_tracker

    Usage:
      1. Unzip project_tracker-repo.zip
      2. cd into the extracted 'repo' folder
      3. .\push-to-github.ps1

    Assumes the GitHub repository already exists and is empty.
#>

$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/hq2026sgx/project_tracker.git"

if (-not (Test-Path ".\project-tracker.html")) {
    Write-Host "Run this from inside the repo folder (project-tracker.html not found here)." -ForegroundColor Red
    exit 1
}

Write-Host "Running checks..." -ForegroundColor Cyan
node tools\check.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "Checks failed - not pushing." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path ".\.git")) {
    Write-Host "`nInitialising repository..." -ForegroundColor Cyan
    git init -b main
    git add -A
    git commit -m "Initial commit - Project Tracker v6.44

Single-file client project and production issue tracker for SGX FX.

Includes a fix found while validating the v6.43 build: the import routine
cleared an element named searchIssues, but the Issues search box is
searchIssue, so a stale search term kept filtering imported issues out of
view. tools/check.js now cross-references every getElementById target
against the ids present in the markup."
}

if (git remote | Select-String -Quiet '^origin$') {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}

Write-Host "`nPushing to $RepoUrl" -ForegroundColor Cyan
git push -u origin main

Write-Host "`nTagging v6.44..." -ForegroundColor Cyan
git tag -a v6.44 -m "v6.44 - import search box fix"
git push origin v6.44

Write-Host "`nDone. https://github.com/hq2026sgx/project_tracker" -ForegroundColor Green
Write-Host "Check the repo is set to Private - the changelog and docs reference client names." -ForegroundColor Yellow
