# Quick Admin Login Fix

## Problem
Cannot login to admin panel - likely missing environment variables.

## Solution

### Step 1: Create `.env.local` file

Create a file named `.env.local` in your project root (same folder as `package.json`) with these contents:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Admin Credentials (REQUIRED)
ADMIN_EMAIL=admin@eurolink.com
ADMIN_PASSWORD=YourStrongPassword123!

# Optional: Service Role Key (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Email Configuration
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (optional)

### Step 3: Set Admin Password

Choose a strong password and set it in `.env.local`:
```env
ADMIN_PASSWORD=YourStrongPassword123!
```

**Important**: Use a strong password! This is your admin access.

### Step 4: Restart Development Server

After creating/updating `.env.local`:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Login

1. Go to: `http://localhost:3000/admin/login`
2. Enter:
   - **Email**: `admin@eurolink.com` (or your ADMIN_EMAIL value)
   - **Password**: Your ADMIN_PASSWORD value
3. Click "Login as Admin"

## Troubleshooting

### Still can't login?

1. **Check browser console** (F12) for error messages
2. **Check server terminal** for API errors
3. **Verify .env.local exists** in project root
4. **Restart server** after creating .env.local
5. **Check file name** - must be exactly `.env.local` (not `.env.local.txt`)

### Common Errors

**"Admin authentication not configured"**
→ `ADMIN_PASSWORD` not set in `.env.local`

**"Invalid admin credentials"**
→ Email/password doesn't match `ADMIN_EMAIL`/`ADMIN_PASSWORD`

**"Database not configured"**
→ Supabase URL/keys not set correctly

**"Session not set"**
→ Check Supabase credentials are correct

## File Location

Your `.env.local` should be here:
```
euro-link/
├── .env.local          ← CREATE THIS FILE
├── package.json
├── app/
└── ...
```

## Security Note

⚠️ **Never commit `.env.local` to git!** It contains sensitive credentials.

The `.gitignore` should already exclude it, but verify it's not tracked:
```bash
git check-ignore .env.local
```

If it returns nothing, add to `.gitignore`:
```
.env.local
.env*.local
```

