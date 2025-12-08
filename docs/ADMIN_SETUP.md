# Admin & Driver Account Setup

## 🔐 Admin Login

### Admin Login URL:
```
http://localhost:3000/admin/login
```

### Admin Credentials:
- **Email**: `admin@eurolink.com`
- **Password**: `Euro_0987654321`

## 📝 Important Notes

1. **Separate Login Pages**:
   - **User Login**: `/auth/login` - For regular customers
   - **Admin Login**: `/admin/login` - For admin and driver access

2. **Public Registration**: Users can ONLY register as "Customer" through `/auth/register`
3. **Admin/Driver Accounts**: Must be created manually (not through public UI)
4. **Admin Login**: The admin account will be auto-created on first login attempt

## 🚀 Setting Up Admin Account

### Option 1: Auto-Creation (Recommended)
1. Go to `/admin/login`
2. Enter admin credentials:
   - Email: `admin@eurolink.com`
   - Password: `Euro_0987654321`
3. The system will automatically create the admin account if it doesn't exist
4. You'll be redirected to `/admin/dashboard`

### Option 2: Manual Creation via Supabase Dashboard

1. **Create Auth User**:
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User" → "Create new user"
   - Email: `admin@eurolink.com`
   - Password: `Euro_0987654321`
   - Auto Confirm User: ✅ (check this)

2. **Create Profile**:
   - Go to Table Editor → `profiles`
   - Insert new row:
     - `id`: Copy the user ID from Authentication → Users
     - `full_name`: `System Administrator`
     - `role`: `Admin`

### Option 3: SQL Script

Run this in Supabase SQL Editor:

```sql
-- Create admin user (if not exists)
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
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@eurolink.com',
  crypt('Euro_0987654321', gen_salt('bf')), -- Password hash
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"System Administrator"}',
  false,
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Create admin profile
INSERT INTO profiles (
  id,
  full_name,
  role
)
SELECT 
  id,
  'System Administrator',
  'Admin'
FROM auth.users
WHERE email = 'admin@eurolink.com'
ON CONFLICT (id) DO UPDATE SET role = 'Admin';
```

## 👤 Creating Driver Accounts

Driver accounts must be created manually:

### Via Supabase Dashboard:

1. **Create Auth User**:
   - Go to Authentication → Users → Add User
   - Enter driver email and password
   - Auto Confirm User: ✅

2. **Create Profile**:
   - Go to Table Editor → `profiles`
   - Insert row with:
     - `id`: Driver's user ID
     - `full_name`: Driver's name
     - `role`: `Driver`

### Via SQL:

```sql
-- Replace with actual driver details
INSERT INTO auth.users (...) VALUES (...);

INSERT INTO profiles (id, full_name, role)
VALUES (
  'driver-user-id-here',
  'Driver Name',
  'Driver'
);
```

## 🔒 Security Notes

- Admin credentials are hardcoded in the admin login page
- Admin login is separate from user login for security
- In production, consider:
  - Using environment variables for admin credentials
  - Implementing proper password hashing
  - Adding 2FA for admin accounts
  - Using Supabase's built-in admin features

## 📱 Accessing Admin Dashboard

After logging in with admin credentials at `/admin/login`:
- URL: `http://localhost:3000/admin/dashboard`
- Or click "Admin Dashboard" button on home page (if logged in as admin)

## 🛠️ Troubleshooting

**Issue**: Admin login fails
- **Solution**: Check if admin account exists in Supabase Authentication
- Verify email is `admin@eurolink.com` (case-insensitive)
- Verify password is exactly `Euro_0987654321`

**Issue**: "Access denied" error
- **Solution**: Check that profile role is set to `Admin` in `profiles` table

**Issue**: Email verification required
- **Solution**: In Supabase Dashboard → Authentication → Users, manually confirm the admin user

**Issue**: Redirected to wrong login page
- **Solution**: Make sure you're using `/admin/login` for admin access, not `/auth/login`
