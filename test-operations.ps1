# Setup operations account for cafe-downtown

$businessId = "cafe-downtown"
$adminEmail = "admin@cafe-downtown.com"
$operationsEmail = "ops-admin@cafe-downtown.com"
$operationsPassword = "ops123"

Write-Host "`n=== SETTING UP OPERATIONS ACCOUNT ===" -ForegroundColor Cyan

# Register operations account
Write-Host "`nRegistering operations account..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body (@{
            email      = $operationsEmail
            password   = $operationsPassword
            businessId = $businessId
            role       = "operations"
        } | ConvertTo-Json)
    
    Write-Host "[OK] Operations account created" -ForegroundColor Green
    Write-Host "  Email: $operationsEmail" -ForegroundColor Gray
    Write-Host "  Business: $businessId" -ForegroundColor Gray
    Write-Host "  Role: operations" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.ErrorDetails.Message -like "*already exists*") {
        Write-Host "[OK] Operations account already exists" -ForegroundColor Yellow
    }
    else {
        Write-Host "[ERROR] registering: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# Login to verify
Write-Host "`nTesting operations login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
            email    = $operationsEmail
            password = $operationsPassword
        } | ConvertTo-Json)
    
    Write-Host "[OK] Operations login successful" -ForegroundColor Green
    Write-Host "  Token: $($loginResponse.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "  Business ID: $($loginResponse.businessId)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.role)" -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] logging in: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== OPERATIONS ACCOUNT READY ===" -ForegroundColor Green
Write-Host "You can now login to operations dashboard with:" -ForegroundColor White
Write-Host "  URL: http://localhost:5173/operations/login" -ForegroundColor Cyan
Write-Host "  Email: $operationsEmail" -ForegroundColor Yellow
Write-Host "  Password: $operationsPassword" -ForegroundColor Yellow
