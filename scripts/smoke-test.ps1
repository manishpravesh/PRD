param(
  [string]$ApiBaseUrl = "http://localhost:4000",
  [string]$FrontendBaseUrl = "http://localhost:5173"
)

$ErrorActionPreference = "Stop"

function Invoke-WithRetry {
  param(
    [string]$Uri,
    [string]$Method = "GET",
    [int]$MaxAttempts = 8,
    [int]$DelaySeconds = 5
  )

  for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    try {
      return Invoke-WebRequest -Uri $Uri -Method $Method -UseBasicParsing
    } catch {
      if ($attempt -eq $MaxAttempts) {
        throw
      }

      Write-Host "[RETRY] $Uri attempt $attempt failed. Waiting $DelaySeconds seconds..."
      Start-Sleep -Seconds $DelaySeconds
    }
  }
}

function Assert-Status {
  param(
    [string]$Name,
    [int]$Expected,
    [object]$Response
  )

  if ($Response.StatusCode -ne $Expected) {
    throw "$Name failed: expected $Expected got $($Response.StatusCode)"
  }

  Write-Host "[PASS] $Name -> $($Response.StatusCode)"
}

Write-Host "Running smoke checks..."

$health = Invoke-WithRetry -Uri "$ApiBaseUrl/health"
Assert-Status -Name "Backend health" -Expected 200 -Response $health

$apiRoot = Invoke-WithRetry -Uri "$ApiBaseUrl/api/v1"
Assert-Status -Name "API root" -Expected 200 -Response $apiRoot

$charities = Invoke-WithRetry -Uri "$ApiBaseUrl/api/v1/charities"
Assert-Status -Name "Public charities" -Expected 200 -Response $charities

$draws = Invoke-WithRetry -Uri "$ApiBaseUrl/api/v1/draws"
Assert-Status -Name "Public draws" -Expected 200 -Response $draws

$frontend = Invoke-WithRetry -Uri $FrontendBaseUrl
Assert-Status -Name "Frontend home" -Expected 200 -Response $frontend

Write-Host "Smoke checks completed successfully."
