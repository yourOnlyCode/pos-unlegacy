# Setup admin account and log into operations dashboard

$businessId = "cafe-downtown"
$email = "admin@cafe-downtown.com"
$password = "admin123"

Write-Host "`n=== SETTING UP ADMIN ACCOUNT ===" -ForegroundColor Cyan

# Step 1: Register admin account
Write-Host "`nRegistering admin account..." -ForegroundColor Yellow
try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" -Method POST -ContentType "application/json" -Body (@{
            email      = $email
            password   = $password
            businessId = $businessId
        } | ConvertTo-Json)
    
    Write-Host "[OK] Admin account created" -ForegroundColor Green
    Write-Host "  Email: $email" -ForegroundColor Gray
    Write-Host "  Business: $businessId" -ForegroundColor Gray
}
catch {
    if ($_.Exception.Message -like "*already exists*" -or $_.ErrorDetails.Message -like "*already exists*") {
        Write-Host "[OK] Admin account already exists" -ForegroundColor Yellow
    }
    else {
        Write-Host "[ERROR] registering: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Step 2: Login to get token
Write-Host "`nLogging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body (@{
            email    = $email
            password = $password
        } | ConvertTo-Json)
    
    $token = $loginResponse.token
    Write-Host "[OK] Logged in successfully" -ForegroundColor Green
    Write-Host "  Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] logging in: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Fetch orders to verify
Write-Host "`nFetching orders..." -ForegroundColor Yellow
try {
    $ordersResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/admin/business/$businessId/orders" -Method GET -Headers @{
        Authorization = "Bearer $token"
    }
    
    Write-Host "[OK] Orders fetched successfully" -ForegroundColor Green
    Write-Host "  Total Orders: $($ordersResponse.totalOrders)" -ForegroundColor Yellow
    Write-Host "  Total Revenue: `$$($ordersResponse.totalRevenue)" -ForegroundColor Green
    
    if ($ordersResponse.orders.Count -gt 0) {
        Write-Host "`n=== RECENT ORDERS ===" -ForegroundColor Cyan
        $ordersResponse.orders | Select-Object -First 5 | ForEach-Object {
            Write-Host "`nOrder #$($_.id)" -ForegroundColor White
            Write-Host "  Customer: $($_.customerName)" -ForegroundColor Yellow
            Write-Host "  Table: $($_.tableNumber)" -ForegroundColor Yellow
            Write-Host "  Status: $($_.status)" -ForegroundColor Cyan
            Write-Host "  Total: `$$($_.total)" -ForegroundColor Green
        }
    }
    else {
        Write-Host "`n[WARN] No orders found. Run test-order.ps1 or test-conversation.ps1 first." -ForegroundColor Yellow
    }
}
catch {
    Write-Host "[ERROR] fetching orders: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Cyan
Write-Host "1. Open browser to: http://localhost:5173/operations/$businessId" -ForegroundColor White
Write-Host "2. Login with:" -ForegroundColor White
Write-Host "   Email: $email" -ForegroundColor Gray
Write-Host "   Password: $password" -ForegroundColor Gray
Write-Host "3. You should see $($ordersResponse.totalOrders) orders in the dashboard" -ForegroundColor White

Write-Host "`n[OK] Setup complete!" -ForegroundColor Green
