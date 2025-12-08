@echo off
echo Installing dependencies...
echo.

echo Installing lucide-react...
call npm install lucide-react@0.263.1 --save

echo Installing @supabase/supabase-js...
call npm install @supabase/supabase-js --save

echo Installing sonner...
call npm install sonner --save

echo.
echo Installation complete!
echo.
pause

