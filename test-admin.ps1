# Test the admin portal

# Get all businesses to find business IDs
$businesses = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tenants" -Method GET

Write-Host "`n=== AVAILABLE BUSINESSES ===" -ForegroundColor Cyan
$businesses | ForEach-Object {
    $adminUrl = "http://localhost:3000/admin/$($_.id)"
    Write-Host "`nBusiness: $($_.businessName)" -ForegroundColor Yellow
    Write-Host "Business ID: $($_.id)" -ForegroundColor White
    Write-Host "Admin Portal: $adminUrl" -ForegroundColor Green
    Write-Host "Menu Items: $($_.menu.Keys.Count)" -ForegroundColor White
}

# Open first business admin portal
if ($businesses.Count -gt 0) {
    $firstBusiness = $businesses[0]
    $adminUrl = "http://localhost:3000/admin/$($firstBusiness.id)"
    
    Write-Host "`n=== OPENING ADMIN PORTAL ===" -ForegroundColor Cyan
    Write-Host "Opening: $($firstBusiness.businessName)" -ForegroundColor Yellow
    Write-Host "URL: $adminUrl" -ForegroundColor Green
    
    Start-Sleep -Seconds 1
    Start-Process $adminUrl
}
