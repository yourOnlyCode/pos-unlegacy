# View all test orders in the system

Write-Host "`n=== VIEWING ALL ORDERS ===" -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/test/orders" -Method GET
    
    Write-Host "`nTotal Orders: $($response.totalOrders)" -ForegroundColor Yellow
    
    if ($response.totalOrders -eq 0) {
        Write-Host "No orders found. Run test-order.ps1 or test-conversation.ps1 first." -ForegroundColor Gray
    } else {
        Write-Host "`n=== ORDER LIST ===" -ForegroundColor Cyan
        
        $response.orders | ForEach-Object {
            Write-Host "`nOrder ID: $($_.id)" -ForegroundColor Yellow
            Write-Host "Customer: $($_.customerName)" -ForegroundColor White
            Write-Host "Table: $($_.tableNumber)" -ForegroundColor White
            Write-Host "Phone: $($_.customerPhone)" -ForegroundColor Gray
            Write-Host "Business: $($_.businessName) ($($_.businessPhone))" -ForegroundColor Cyan
            Write-Host "Status: $($_.status)" -ForegroundColor $(if ($_.status -eq 'paid') { 'Green' } elseif ($_.status -eq 'awaiting_payment') { 'Yellow' } else { 'White' })
            Write-Host "Items:" -ForegroundColor White
            $_.items | ForEach-Object {
                Write-Host "  - $($_.quantity)x $($_.name) @ `$$($_.price)" -ForegroundColor Gray
            }
            Write-Host "Total: `$$($_.total)" -ForegroundColor Green
            Write-Host "Created: $($_.createdAt)" -ForegroundColor Gray
        }
    }
}
catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the server is running on port 5000" -ForegroundColor Yellow
}

Write-Host "`n=== VIEWING CAFE ORDERS ONLY ===" -ForegroundColor Cyan
try {
    $cafeResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/test/orders/%2B15551234567" -Method GET
    Write-Host "Downtown Cafe Orders: $($cafeResponse.totalOrders)" -ForegroundColor Yellow
}
catch {
    Write-Host "Error fetching cafe orders" -ForegroundColor Red
}
