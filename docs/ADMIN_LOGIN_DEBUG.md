# Admin Login Debugging Guide

## Quick Test Steps

1. **Open Browser Console** (F12)
2. **Navigate to** `/admin/login`
3. **Enter credentials** and click "Login as Admin"
4. **Watch console** for these messages:
   - "Starting admin login..."
   - "API response status: 200" (or error code)
   - "API response data: ..."
   - "Setting session..."
   - "Verifying session..."
   - "Login successful, redirecting..."

## Common Issues & Solutions

### Issue 1: "Logging in..." Never Stops

**Possible Causes:**
- API route hanging
- Network timeout
- Session not being set

**Debug Steps:**
1. Check browser Network tab - look for `/api/admin/verify` request
2. Check if request completes (status 200 or error)
3. Check server terminal for errors

**Solution:**
- Request has 10-second timeout
- If timeout occurs, check `.env.local` has all required variables
- Restart dev server: `npm run dev`

### Issue 2: "Invalid admin credentials"

**Check:**
1. `.env.local` file exists
2. `ADMIN_EMAIL` matches what you're entering
3. `ADMIN_PASSWORD` matches what you're entering
4. No extra spaces in `.env.local`

### Issue 3: "No session received"

**Check:**
1. Server terminal for API route errors
2. Supabase connection is working
3. Admin account exists in Supabase

**Solution:**
- API route will auto-create admin account if it doesn't exist
- Check Supabase dashboard for user

### Issue 4: "Session not set"

**Check:**
1. Browser console for session error details
2. Supabase URL and keys are correct in `.env.local`
3. Try clearing browser cache/cookies

### Issue 5: Redirects Back to Login

**Check:**
1. User profile has `role = 'Admin'` in `profiles` table
2. Session is valid
3. Check browser console for access denied messages

**Solution:**
```sql
-- Check profile
SELECT * FROM profiles WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@eurolink.com');

-- Fix role if needed
UPDATE profiles 
SET role = 'Admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@eurolink.com');
```

## Environment Variables Checklist

Make sure `.env.local` has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
ADMIN_EMAIL=admin@eurolink.com
ADMIN_PASSWORD=YourPasswordHere
```

## Testing the API Route Directly

You can test the API route with curl:

```bash
curl -X POST http://localhost:3000/api/admin/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eurolink.com","password":"YourPassword"}'
```

Expected response:
```json
{
  "success": true,
  "user": {...},
  "session": {...}
}
```

## Server Logs

Check your terminal where `npm run dev` is running for:
- "Creating admin account..."
- "Returning signup session"
- "Returning successful login session"
- Any error messages

