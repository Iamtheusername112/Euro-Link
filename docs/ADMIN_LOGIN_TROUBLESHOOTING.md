# Admin Login Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: "Admin authentication not configured"

**Error Message**: "Admin authentication not configured"

**Solution**:
1. Create `.env.local` file in project root (if it doesn't exist)
2. Add these environment variables:
   ```env
   ADMIN_EMAIL=admin@eurolink.com
   ADMIN_PASSWORD=YourStrongPassword123!
   ```
3. Restart your development server (`npm run dev`)

### Issue 2: "Invalid admin credentials"

**Error Message**: "Invalid admin credentials"

**Possible Causes**:
1. Wrong email or password
2. Environment variables not loaded

**Solution**:
1. Check `.env.local` file exists and has correct values
2. Make sure you're using the exact email from `ADMIN_EMAIL`
3. Make sure password matches `ADMIN_PASSWORD` exactly
4. Restart dev server after changing `.env.local`

### Issue 3: "Email not confirmed" or "User not found"

**Error Message**: "Please verify your email or contact support"

**Solution**:
The system will auto-create the admin account. If this fails:

1. **Check Supabase Email Settings**:
   - Go to Supabase Dashboard → Authentication → Settings
   - Under "Email Auth", check "Enable email confirmations"
   - For admin accounts, you may want to disable this temporarily

2. **Manually Confirm Email**:
   - Go to Supabase Dashboard → Authentication → Users
   - Find the admin user
   - Click "..." → "Send confirmation email" OR manually confirm

3. **Or Create Admin Manually**:
   ```sql
   -- Run in Supabase SQL Editor
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
   ) VALUES (
     '00000000-0000-0000-0000-000000000000',
     gen_random_uuid(),
     'authenticated',
     'authenticated',
     'admin@eurolink.com',
     crypt('YourPasswordHere', gen_salt('bf')),
     NOW(),
     NOW(),
     NOW(),
     '{"provider":"email","providers":["email"]}',
     '{"full_name":"System Administrator"}',
     FALSE,
     '',
     ''
   );
   ```

### Issue 4: Session Not Set

**Error Message**: "Session not set. Please check your credentials."

**Solution**:
1. Check browser console for errors
2. Clear browser cookies/localStorage
3. Try logging in again
4. Check Supabase project URL and keys are correct

### Issue 5: Redirected Back to Login

**Symptom**: After login, redirected back to `/admin/login`

**Possible Causes**:
1. Profile doesn't have Admin role
2. Session expired
3. Access check failing

**Solution**:
1. Check user profile in Supabase:
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@eurolink.com';
   ```
   
2. If role is not 'Admin', update it:
   ```sql
   UPDATE profiles 
   SET role = 'Admin' 
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@eurolink.com');
   ```

## Step-by-Step Setup

### 1. Set Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
ADMIN_EMAIL=admin@eurolink.com
ADMIN_PASSWORD=YourStrongPassword123!
```

### 2. Restart Server

```bash
npm run dev
```

### 3. Go to Admin Login

Navigate to: `http://localhost:3000/admin/login`

### 4. Enter Credentials

- Email: `admin@eurolink.com` (or your ADMIN_EMAIL)
- Password: Your ADMIN_PASSWORD value

### 5. Check Browser Console

If login fails, check browser console for error messages.

## Quick Fix Script

Run this in Supabase SQL Editor to create admin account:

```sql
-- Get admin email and password from your .env.local
-- Replace 'YourPasswordHere' with your ADMIN_PASSWORD

-- Create admin user (if not exists)
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if user exists
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@eurolink.com';

  -- If user doesn't exist, create it
  IF admin_user_id IS NULL THEN
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
      is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@eurolink.com',
      crypt('YourPasswordHere', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"System Administrator"}',
      FALSE
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Create or update admin profile
  INSERT INTO profiles (id, full_name, role)
  VALUES (admin_user_id, 'System Administrator', 'Admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'Admin', full_name = 'System Administrator';
END $$;
```

## Still Having Issues?

1. Check Supabase Dashboard → Authentication → Users
2. Verify admin user exists
3. Check user's email_confirmed_at is set
4. Verify profile has role = 'Admin'
5. Check browser console for detailed errors
6. Check server logs for API errors

