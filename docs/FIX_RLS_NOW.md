# 🔧 Fix RLS Policy Error - Step by Step

## The Problem
You're seeing: `Error adding to status history: {}` with code `42501`

This means the admin user doesn't have permission to insert into the `shipment_status_history` table.

## The Solution

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Copy and Run This SQL

Copy the entire SQL script below and paste it into the SQL Editor, then click **Run**:

```sql
-- Fix RLS Policy for shipment_status_history table
DROP POLICY IF EXISTS "Admins and drivers can insert status history" ON shipment_status_history;

CREATE POLICY "Admins and drivers can insert status history"
  ON shipment_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Verify the policy was created
SELECT 
  '✅ Policy created' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'shipment_status_history'
AND cmd = 'INSERT';
```

### Step 3: Verify Success
After running, you should see:
- A success message: "Success. No rows returned" (this is normal for DROP/CREATE)
- A verification query result showing 1 row with the policy name

### Step 4: Test in Admin Dashboard
1. Go back to your admin dashboard
2. Try updating a shipment status
3. Check the browser console - you should see "Status history added successfully" instead of the error

## Still Having Issues?

If you still get errors after running the SQL:

1. **Check your admin profile role:**
   ```sql
   SELECT id, email, role FROM profiles WHERE role = 'Admin';
   ```
   Make sure your admin user has `role = 'Admin'` (case-sensitive)

2. **Verify the policy exists:**
   ```sql
   SELECT policyname, cmd FROM pg_policies 
   WHERE tablename = 'shipment_status_history' AND cmd = 'INSERT';
   ```
   You should see: `"Admins and drivers can insert status history" | INSERT`

3. **Check RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename = 'shipment_status_history';
   ```
   `rowsecurity` should be `true`

## Quick Copy-Paste SQL (All-in-One)

```sql
-- Complete fix - copy and paste this entire block
DROP POLICY IF EXISTS "Admins and drivers can insert status history" ON shipment_status_history;

CREATE POLICY "Admins and drivers can insert status history"
  ON shipment_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

SELECT '✅ Done! Policy created successfully' as result;
```

