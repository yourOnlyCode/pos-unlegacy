# Hardcoded test script for cafe order

# Test configuration
$businessPhone = "+15551234567"  # Downtown Cafe phone
$customerPhone = "+19998887777"
$orderMessage = "Sarah, 2 coffee, 1 sandwich"

Write-Host "`n=== TESTING ORDER ===" -ForegroundColor Cyan
Write-Host "Business Phone: $businessPhone" -ForegroundColor Yellow
Write-Host "Customer Phone: $customerPhone" -ForegroundColor Yellow
Write-Host "Order Message: '$orderMessage'" -ForegroundColor Yellow

# Send order
Write-Host "`nSending order..." -ForegroundColor White
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
    message = $orderMessage
    customerPhone = $customerPhone
    businessPhone = $businessPhone
} | ConvertTo-Json)

# Display parsed order
Write-Host "`n=== ORDER PARSED ===" -ForegroundColor Cyan
Write-Host "Customer: $($response.parsedOrder.customerName)" -ForegroundColor Yellow
Write-Host "Items:" -ForegroundColor White
$response.parsedOrder.items | ForEach-Object {
    Write-Host "  - $($_.quantity)x $($_.name) @ `$$($_.price) = `$$($_.price * $_.quantity)" -ForegroundColor White
}
Write-Host "Total: `$$($response.parsedOrder.total)" -ForegroundColor Green
Write-Host "Fuzzy Matching: $($response.parsedOrder.hasFuzzyMatches)" -ForegroundColor $(if ($response.parsedOrder.hasFuzzyMatches) { "Magenta" } else { "Gray" })

# Display SMS response
Write-Host "`n=== SMS TO CUSTOMER ===" -ForegroundColor Cyan
Write-Host $response.smsResponse -ForegroundColor White

# Display payment info
Write-Host "`n=== PAYMENT INFO ===" -ForegroundColor Cyan
Write-Host "Order ID: $($response.orderId)" -ForegroundColor Yellow
Write-Host "Payment Link: $($response.paymentLink)" -ForegroundColor Green

# Open payment page
Write-Host "`nOpening payment page in browser..." -ForegroundColor Cyan
Start-Sleep -Seconds 1
Start-Process $response.paymentLink

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "Payment page should now be open. Click 'Pay' to complete the order." -ForegroundColor White
