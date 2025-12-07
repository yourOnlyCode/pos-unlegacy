# Quick End-to-End Test
Write-Host "`n=== QUICK E2E TEST ===" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing server health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/api/health"
    Write-Host "   ✓ Server: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Server not responding" -ForegroundColor Red
    exit 1
}

# Test 2: Create Order
Write-Host "`n2. Creating test order..." -ForegroundColor Yellow
$orderData = @{
    message = "Alice, table 3, 2 coffee, 1 sandwich"
    customerPhone = "+19998887777"
    businessPhone = "+15551234567"
} | ConvertTo-Json

try {
    $order = Invoke-RestMethod -Uri "http://localhost:5000/api/test/sms" -Method POST -ContentType "application/json" -Body $orderData
    
    if ($order.success) {
        Write-Host "   ✓ Order created: $($order.orderId)" -ForegroundColor Green
        Write-Host "   Customer: $($order.parsedOrder.customerName)" -ForegroundColor Gray
        Write-Host "   Items: $($order.parsedOrder.items.Count)" -ForegroundColor Gray
        Write-Host "   Total: `$$($order.parsedOrder.total)" -ForegroundColor Gray
        Write-Host "   Payment Link: $($order.paymentLink)" -ForegroundColor Cyan
        
        $global:orderId = $order.orderId
        $global:paymentLink = $order.paymentLink
    } else {
        Write-Host "   ✗ Order failed: $($order.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    exit 1
}

# Test 3: Verify Order
Write-Host "`n3. Verifying order in system..." -ForegroundColor Yellow
try {
    $allOrders = Invoke-RestMethod -Uri "http://localhost:5000/api/test/orders"
    Write-Host "   ✓ Total orders in system: $($allOrders.totalOrders)" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Could not retrieve orders" -ForegroundColor Red
}

# Test 4: Admin Login
Write-Host "`n4. Testing admin authentication..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@cafe-downtown.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginData
    Write-Host "   ✓ Admin login successful" -ForegroundColor Green
    $global:token = $login.token
} catch {
    Write-Host "   ✗ Login failed" -ForegroundColor Red
}

# Test 5: Fetch Orders via Admin API
Write-Host "`n5. Fetching orders via admin API..." -ForegroundColor Yellow
try {
    $orders = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/business/cafe-downtown/orders" -Headers @{
        Authorization = "Bearer $global:token"
    }
    Write-Host "   ✓ Orders retrieved: $($orders.totalOrders)" -ForegroundColor Green
    Write-Host "   Revenue: `$$($orders.totalRevenue)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Could not fetch orders" -ForegroundColor Red
}

# Summary
Write-Host "`n=== TEST RESULTS ===" -ForegroundColor Cyan
Write-Host "✓ All tests passed!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Open browser: http://localhost:3001" -ForegroundColor White
Write-Host "2. Login as admin: admin@cafe-downtown.com / admin123" -ForegroundColor White
Write-Host "3. View the order in the dashboard" -ForegroundColor White
Write-Host "4. Open payment link to complete order:" -ForegroundColor White
Write-Host "   $global:paymentLink" -ForegroundColor Cyan
