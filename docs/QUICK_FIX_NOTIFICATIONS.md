# Quick Fix: Notifications Table Error

## Error Message
```
Could not find the table 'public.notifications' in the schema cache
```

## Solution

The `notifications` table hasn't been created in your Supabase database yet. Follow these steps:

### Step 1: Open Supabase SQL Editor
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Database Setup
1. Open `docs/SETUP_DATABASE.sql` in your project
2. **Copy ALL the SQL** from that file (Ctrl+A, Ctrl+C)
3. Paste it into the Supabase SQL Editor
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for success message ✅

### Step 3: Verify Tables Were Created
Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'shipments', 'shipment_status_history', 'payments', 'notifications')
ORDER BY table_name;
```

You should see 5 tables:
- ✅ profiles
- ✅ shipments
- ✅ shipment_status_history
- ✅ payments
- ✅ notifications

### Step 4: Refresh Your App
After running the SQL:
1. Go back to your app
2. Refresh the page (F5 or Ctrl+R)
3. The errors should be gone! 🎉

---

## What the Setup SQL Creates

The `SETUP_DATABASE.sql` file creates:

1. **profiles** - User profile information
2. **shipments** - Package shipment records
3. **shipment_status_history** - Status update timeline
4. **payments** - Payment transaction records
5. **notifications** - User notifications (NEW!)
6. **Security Policies** - Row Level Security (RLS) policies
7. **Triggers** - Auto-create profiles and send notifications

---

## Temporary Workaround

The app will continue to work without the notifications table - it will just show 0 notifications. However, to enable the full notification system, you need to run the SQL setup.

---

## Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your Supabase project is active
3. Make sure `.env.local` has correct credentials
4. Check Supabase Dashboard → Settings → API for your keys

