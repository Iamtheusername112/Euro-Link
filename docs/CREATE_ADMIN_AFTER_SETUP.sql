-- ============================================
-- CREATE ADMIN ACCOUNT
-- Run this AFTER running SETUP_DATABASE.sql
-- ============================================

-- Step 1: First create the auth user via Supabase Dashboard
-- Go to: Authentication → Users → Add User
-- Email: admin@eurolink.com
-- Password: Euro_0987654321
-- Auto Confirm User: ✅ (IMPORTANT!)

-- Step 2: Then run this SQL to create/update the admin profile
INSERT INTO profiles (
  id,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT 
  id,
  'System Administrator',
  'Admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@eurolink.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'Admin',
  full_name = 'System Administrator',
  updated_at = NOW();

-- Step 3: Verify admin account
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN '✅ Ready to Login'
    ELSE '⚠️ Email Not Confirmed - Confirm in Dashboard'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@eurolink.com';

