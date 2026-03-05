# Test MySQL Connection with Different Passwords

$passwords = @("", "root", "password", "rootpassword", "mysql", "admin")

Write-Host "Testing MySQL Connection..." -ForegroundColor Cyan
Write-Host ""

foreach ($pwd in $passwords) {
    Write-Host "Testing password: '$pwd'" -ForegroundColor Yellow
    
    $env:MYSQL_PWD = $pwd
    $result = mysql -u root -e "SELECT 1;" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ SUCCESS! Password is: '$pwd'" -ForegroundColor Green
        Write-Host ""
        Write-Host "Update your backend/.env file:" -ForegroundColor Cyan
        Write-Host "DB_PASSWORD=$pwd" -ForegroundColor Yellow
        break
    } else {
        Write-Host "❌ Failed" -ForegroundColor Red
    }
}

Remove-Item Env:\MYSQL_PWD -ErrorAction SilentlyContinue
