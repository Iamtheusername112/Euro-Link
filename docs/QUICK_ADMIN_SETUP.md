# Quick Admin Account Setup Guide

## ⚠️ IMPORTANT: Setup Database First!

**Before creating the admin account, you MUST run the database setup:**

1. Go to Supabase Dashboard → **SQL Editor**
2. Copy and paste the contents of `docs/SETUP_DATABASE.sql`
3. Click **"Run"**
4. Wait for success message
5. Then proceed with admin account creation below

---

## 🚀 Fastest Method (Recommended)

### Step 1: Create Auth User via Supabase Dashboard

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** → **"Create new user"**
4. Fill in:
   - **Email**: Set via `ADMIN_EMAIL` environment variable (default: `admin@eurolink.com`)
   - **Password**: Set via `ADMIN_PASSWORD` environment variable (REQUIRED - use a strong password!)
   - ✅ **Auto Confirm User** (IMPORTANT - check this box!)
5. Click **"Create User"**

### Step 2: Create Admin Profile via SQL

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste this SQL:

```sql
-- Create Admin Profile
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
```

3. Click **"Run"**

### Step 3: Verify

Run this to check if everything is set up correctly:

```sql
SELECT 
  u.email,
  u.email_confirmed_at,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'admin@eurolink.com';
```

You should see:
- Email: `admin@eurolink.com`
- Email Confirmed: A timestamp (not null)
- Full Name: `System Administrator`
- Role: `Admin`

### Step 4: Test Login

1. Go to: `http://localhost:3000/admin/login`
2. Enter:
   - Email: Your `ADMIN_EMAIL` environment variable
   - Password: Your `ADMIN_PASSWORD` environment variable
3. You should be redirected to the admin dashboard!

---

## 🔧 Alternative: Full SQL Method

If you prefer to do everything via SQL, see `docs/CREATE_ADMIN_ACCOUNT.sql` for the complete script.

**Note**: The SQL method is more complex because Supabase handles password hashing. The Dashboard method is recommended.

---

## ⚠️ Troubleshooting

### Issue: "Email not confirmed"
**Solution**: 
- Go to Supabase Dashboard → Authentication → Users
- Find `admin@eurolink.com`
- Click the three dots → "Confirm User"

### Issue: "Profile not found"
**Solution**: 
- Run Step 2 SQL script again
- Make sure the user exists in `auth.users` first

### Issue: "Invalid login credentials"
**Solution**:
- Verify password matches your `ADMIN_PASSWORD` environment variable
- Check email is exactly: `admin@eurolink.com` (case-insensitive)
- Make sure user exists in Supabase Authentication

### Issue: "Access denied"
**Solution**:
- Verify profile role is set to `Admin`:
```sql
SELECT role FROM profiles 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'admin@eurolink.com'
);
```
- Should return: `Admin`
- If not, run Step 2 SQL script again

---

## ✅ Success Checklist

- [ ] User created in Supabase Authentication
- [ ] Email is confirmed (email_confirmed_at is not null)
- [ ] Profile exists in `profiles` table
- [ ] Profile role is set to `Admin`
- [ ] Can login at `/admin/login`
- [ ] Redirected to `/admin/dashboard` after login

