# 🚨 IMPORTANT: Database Setup Required

## You're seeing errors because the database tables don't exist yet!

The errors like "Error fetching shipments: {}" happen because the `shipments` table (and other tables) haven't been created in your Supabase database.

## ✅ Quick Fix - Follow These Steps:

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **"SQL Editor"** in the left sidebar

### Step 2: Run the Database Setup
1. Open the file `docs/SETUP_DATABASE.sql` in your project
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
  AND table_name IN ('profiles', 'shipments', 'shipment_status_history', 'payments')
ORDER BY table_name;
```

You should see 4 tables:
- ✅ profiles
- ✅ shipments
- ✅ shipment_status_history
- ✅ payments

### Step 4: Refresh Your App
After running the SQL:
1. Go back to your app
2. Refresh the page (F5 or Ctrl+R)
3. The errors should be gone! 🎉

---

## 📋 What the Setup SQL Does:

The `SETUP_DATABASE.sql` file creates:

1. **profiles** - User profile information (name, role, etc.)
2. **shipments** - Package shipment records
3. **shipment_status_history** - Status update timeline
4. **payments** - Payment transaction records
5. **Security Policies** - Row Level Security (RLS) policies
6. **Triggers** - Auto-create profiles when users sign up

---

## ⚠️ Common Issues:

### Issue: "relation already exists"
**Solution**: This means tables already exist. That's okay! The SQL uses `CREATE TABLE IF NOT EXISTS` so it's safe to run multiple times.

### Issue: "permission denied"
**Solution**: Make sure you're logged into Supabase Dashboard and have access to the project.

### Issue: "syntax error"
**Solution**: Make sure you copied the ENTIRE SQL file, not just part of it.

### Issue: Still seeing errors after setup
**Solution**: 
1. Verify tables exist (run the verification query above)
2. Check your `.env.local` file has correct Supabase credentials
3. Restart your dev server: `npm run dev`

---

## 🎯 After Setup:

Once the database is set up, you can:
1. Create admin account (see `docs/CREATE_ADMIN_AFTER_SETUP.sql`)
2. Login at `/admin/login`
3. Create shipments
4. View dashboard

---

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for specific error messages
2. Verify your Supabase project is active
3. Make sure `.env.local` has correct credentials
4. Check Supabase Dashboard → Settings → API for your keys

