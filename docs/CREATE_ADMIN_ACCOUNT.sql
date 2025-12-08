-- ============================================
-- CREATE ADMIN ACCOUNT - SQL Script
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: First, create the auth user via Supabase Dashboard
-- Go to: Authentication → Users → Add User
-- Email: Set via ADMIN_EMAIL environment variable
-- Password: Set via ADMIN_PASSWORD environment variable (use a strong password!)
-- Auto Confirm User: ✅ (IMPORTANT!)
-- Then come back and run Step 2 below

-- Step 2: Create/Update Admin Profile
-- This will create the profile or update existing one to Admin role
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

-- Step 3: Verify the admin account was created
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@eurolink.com';

-- ============================================
-- ALTERNATIVE: If you need to create auth user via SQL
-- ============================================
-- Note: This is more complex and requires password hashing
-- It's easier to use Supabase Dashboard for auth user creation

-- First, enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user (if not exists)
-- Note: This creates an unconfirmed user. You'll need to confirm via dashboard
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@eurolink.com';

  -- If user doesn't exist, create it
  IF admin_user_id IS NULL THEN
    -- Generate a new UUID for the user
    admin_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      confirmation_token,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@eurolink.com', -- Use ADMIN_EMAIL env var
      crypt('YOUR_SECURE_PASSWORD_HERE', gen_salt('bf')), -- Use ADMIN_PASSWORD env var - NEVER hardcode!
      NOW(), -- Auto-confirm email
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator"}',
      false,
      '',
      ''
    );

    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
  END IF;

  -- Create or update profile
  INSERT INTO profiles (
    id,
    full_name,
    role,
    created_at,
    updated_at
  )
  VALUES (
    admin_user_id,
    'System Administrator',
    'Admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    role = 'Admin',
    full_name = 'System Administrator',
    updated_at = NOW();

  RAISE NOTICE 'Admin profile created/updated successfully';
END $$;

-- Verify everything was created correctly
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role,
  CASE 
    WHEN u.email_confirmed_at IS NOT NULL THEN 'Email Confirmed ✅'
    ELSE 'Email NOT Confirmed ⚠️ - Go to Dashboard to confirm'
  END as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@eurolink.com';

