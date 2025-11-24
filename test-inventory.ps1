# Test inventory management

$businessPhone = "+15559876543"  # Pizza Palace
$customerPhone = "+19998887777"

Write-Host "`n=== TEST 1: Normal Order (In Stock) ===" -ForegroundColor Cyan
$response1 = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
    message = "John, 1 pizza, 1 wings"
    customerPhone = $customerPhone
    businessPhone = $businessPhone
} | ConvertTo-Json)

Write-Host $response1.smsResponse -ForegroundColor White

Write-Host "`n=== TEST 2: Low Stock Warning ===" -ForegroundColor Cyan
$response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
    message = "Sarah, 2 wings"
    customerPhone = $customerPhone
    businessPhone = $businessPhone
} | ConvertTo-Json)

Write-Host $response2.smsResponse -ForegroundColor White

Write-Host "`n=== TEST 3: Sold Out Item ===" -ForegroundColor Cyan
$response3 = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
    message = "Mike, 10 pizza"
    customerPhone = $customerPhone
    businessPhone = $businessPhone
} | ConvertTo-Json)

Write-Host $response3.smsResponse -ForegroundColor White

Write-Host "`n=== INVENTORY STATUS ===" -ForegroundColor Cyan
Write-Host "Pizza Palace Current Stock:" -ForegroundColor Yellow
$businesses = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tenants" -Method GET
$pizzaPalace = $businesses | Where-Object { $_.phoneNumber -eq $businessPhone }
$pizzaPalace.inventory.GetEnumerator() | ForEach-Object {
    $color = if ($_.Value -eq 0) { "Red" } elseif ($_.Value -le 5) { "Yellow" } else { "Green" }
    Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor $color
}
