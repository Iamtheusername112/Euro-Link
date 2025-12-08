Write-Host "Installing required packages..." -ForegroundColor Green
Write-Host ""

# Install lucide-react
Write-Host "Installing lucide-react..." -ForegroundColor Yellow
npm install lucide-react@0.263.1 --save
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ lucide-react installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install lucide-react" -ForegroundColor Red
}

# Install @supabase/supabase-js
Write-Host "Installing @supabase/supabase-js..." -ForegroundColor Yellow
npm install @supabase/supabase-js --save
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ @supabase/supabase-js installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install @supabase/supabase-js" -ForegroundColor Red
}

# Install sonner
Write-Host "Installing sonner..." -ForegroundColor Yellow
npm install sonner --save
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ sonner installed" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install sonner" -ForegroundColor Red
}

Write-Host ""
Write-Host "Verifying installation..." -ForegroundColor Cyan

# Verify installations
if (Test-Path "node_modules\lucide-react") {
    Write-Host "✓ lucide-react found in node_modules" -ForegroundColor Green
} else {
    Write-Host "✗ lucide-react NOT found" -ForegroundColor Red
}

if (Test-Path "node_modules\@supabase\supabase-js") {
    Write-Host "✓ @supabase/supabase-js found in node_modules" -ForegroundColor Green
} else {
    Write-Host "✗ @supabase/supabase-js NOT found" -ForegroundColor Red
}

if (Test-Path "node_modules\sonner") {
    Write-Host "✓ sonner found in node_modules" -ForegroundColor Green
} else {
    Write-Host "✗ sonner NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "Installation complete!" -ForegroundColor Green
Write-Host "You can now run: npm run dev" -ForegroundColor Cyan

