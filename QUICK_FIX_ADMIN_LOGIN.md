# Quick Fix: Admin Login "Invalid admin credentials"

## The Problem
The API route is rejecting your credentials because they don't match what's in `.env.local`.

## Solution

### Step 1: Check your `.env.local` file

Make sure you have a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ADMIN_EMAIL=admin@eurolink.com
ADMIN_PASSWORD=YourActualPasswordHere
```

### Step 2: Verify the values match

1. **ADMIN_EMAIL** - Must match exactly what you're entering in the login form (case-insensitive)
2. **ADMIN_PASSWORD** - Must match exactly what you're entering (case-sensitive, no extra spaces)

### Step 3: Restart your dev server

After updating `.env.local`, restart your server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Check server logs

When you try to login, check your terminal where `npm run dev` is running. You should see logs like:

```
Verifying credentials: {
  providedEmail: 'admin@eurolink.com',
  expectedEmail: 'admin@eurolink.com',
  emailMatch: true,
  passwordMatch: true,
  hasPassword: true
}
```

If `emailMatch` or `passwordMatch` is `false`, that's the problem.

### Step 5: Common Issues

1. **No `.env.local` file** - Create it with the template above
2. **Wrong email** - Make sure ADMIN_EMAIL matches what you're typing
3. **Wrong password** - Make sure ADMIN_PASSWORD matches exactly (no spaces, correct case)
4. **Server not restarted** - Environment variables only load when server starts

### Step 6: Test

1. Make sure `.env.local` has correct values
2. Restart server: `npm run dev`
3. Go to `/admin/login`
4. Enter the exact email from `ADMIN_EMAIL`
5. Enter the exact password from `ADMIN_PASSWORD`
6. Check server terminal for debug logs

## Still Not Working?

Check the server terminal logs when you try to login - they will show exactly what's being compared.

