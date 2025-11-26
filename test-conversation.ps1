# Test conversation flow with single prompt (missing name and table)

# Test configuration
$businessPhone = "+15551234567"  # Downtown Cafe phone
$customerPhone = "+19998887777"

Write-Host "`n=== TESTING CONVERSATION ORDER FLOW ===" -ForegroundColor Cyan
Write-Host "This test simulates a customer who forgets to include their name and table number" -ForegroundColor Gray

# Step 1: Customer sends order without name or table
$step1Message = "2 coffee, 1 sandwich"
Write-Host "`n--- STEP 1: Customer sends order ---" -ForegroundColor Yellow
Write-Host "Message: '$step1Message'" -ForegroundColor White

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
            message       = $step1Message
            customerPhone = $customerPhone
            businessPhone = $businessPhone
        } | ConvertTo-Json)
    
    Write-Host "SMS Response: $($response1.smsResponse)" -ForegroundColor Cyan
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Customer provides name and table in one response
Start-Sleep -Seconds 2
$step2Message = "John Smith, table 5"
Write-Host "`n--- STEP 2: Customer provides name and table ---" -ForegroundColor Yellow
Write-Host "Message: '$step2Message'" -ForegroundColor White

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
            message       = $step2Message
            customerPhone = $customerPhone
            businessPhone = $businessPhone
        } | ConvertTo-Json)
    
    Write-Host "SMS Response: $($response2.smsResponse)" -ForegroundColor Cyan
    
    if ($response2.success) {
        Write-Host "`n=== ORDER COMPLETED ===" -ForegroundColor Green
        Write-Host "Customer: $($response2.parsedOrder.customerName)" -ForegroundColor Yellow
        Write-Host "Table: #$($response2.parsedOrder.tableNumber)" -ForegroundColor Yellow
        Write-Host "Items:" -ForegroundColor White
        $response2.parsedOrder.items | ForEach-Object {
            Write-Host "  - $($_.quantity)x $($_.name) @ `$$($_.price) = `$$($_.price * $_.quantity)" -ForegroundColor White
        }
        Write-Host "Total: `$$($response2.parsedOrder.total)" -ForegroundColor Green
        Write-Host "`nPayment Link: $($response2.paymentLink)" -ForegroundColor Cyan
        
        # Open payment page
        if ($response2.paymentLink) {
            Write-Host "`nOpening payment page in browser..." -ForegroundColor Cyan
            Start-Sleep -Seconds 1
            Start-Process $response2.paymentLink
        }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "Payment page should now be open. Click 'Pay' to complete the order and see it in Operations Dashboard." -ForegroundColor White

# Additional test scenarios
Write-Host "`n`n=== TESTING ALTERNATE FORMATS ===" -ForegroundColor Cyan

# Test with just name (table optional)
$altCustomer = "+19998887778"
Write-Host "`n--- Testing: Name without table ---" -ForegroundColor Yellow
Start-Sleep -Seconds 1

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
        message       = "2 coffee"
        customerPhone = $altCustomer
        businessPhone = $businessPhone
    } | ConvertTo-Json)
Write-Host "Prompt: $($response.smsResponse)" -ForegroundColor Gray

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
        message       = "Sarah"
        customerPhone = $altCustomer
        businessPhone = $businessPhone
    } | ConvertTo-Json)
Write-Host "Result: Order created for '$($response.parsedOrder.customerName)' at table '$($response.parsedOrder.tableNumber)'" -ForegroundColor Green
Write-Host "Payment Link: $($response.paymentLink)" -ForegroundColor Cyan

# Test with different format
$altCustomer2 = "+19998887779"
Write-Host "`n--- Testing: Name with # format ---" -ForegroundColor Yellow
Start-Sleep -Seconds 1

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
        message       = "1 latte"
        customerPhone = $altCustomer2
        businessPhone = $businessPhone
    } | ConvertTo-Json)

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body (@{
        message       = "Mike, #7"
        customerPhone = $altCustomer2
        businessPhone = $businessPhone
    } | ConvertTo-Json)
Write-Host "Result: Order created for '$($response.parsedOrder.customerName)' at table '$($response.parsedOrder.tableNumber)'" -ForegroundColor Green
Write-Host "Payment Link: $($response.paymentLink)" -ForegroundColor Cyan

Write-Host "`n=== ALL TESTS COMPLETE ===" -ForegroundColor Green
Write-Host "Note: Only the first payment link was opened automatically. Check above for other payment links." -ForegroundColor Gray
