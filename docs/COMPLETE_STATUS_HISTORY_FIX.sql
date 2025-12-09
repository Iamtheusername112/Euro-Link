-- Complete Fix for Status History RLS Policy
-- Run this entire script in Supabase SQL Editor

-- Step 1: Verify table exists
SELECT 'Table exists' as check_result
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name = 'shipment_status_history';

-- Step 2: Check current policies
SELECT 
  policyname,
  cmd,
  CASE WHEN with_check IS NOT NULL THEN 'Has WITH CHECK' ELSE 'No WITH CHECK' END as has_with_check
FROM pg_policies
WHERE tablename = 'shipment_status_history';

-- Step 3: Drop all existing policies
DROP POLICY IF EXISTS "Users can view status history of their shipments" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins can insert status history" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins and drivers can insert status history" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins and drivers can update status history" ON shipment_status_history;

-- Step 4: Ensure RLS is enabled
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Step 5: Create SELECT policy for users
CREATE POLICY "Users can view status history of their shipments"
  ON shipment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_status_history.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );

-- Step 6: Create INSERT policy for admins and drivers
CREATE POLICY "Admins and drivers can insert status history"
  ON shipment_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Step 7: Create UPDATE policy for admins and drivers (optional)
CREATE POLICY "Admins and drivers can update status history"
  ON shipment_status_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Step 8: Verify policies were created
SELECT 
  'Policy created' as status,
  policyname,
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ Can insert'
    WHEN cmd = 'SELECT' THEN '✅ Can select'
    WHEN cmd = 'UPDATE' THEN '✅ Can update'
    ELSE cmd
  END as permission
FROM pg_policies
WHERE tablename = 'shipment_status_history'
ORDER BY cmd, policyname;

-- Expected output:
-- You should see 3 policies:
-- 1. "Users can view status history of their shipments" | SELECT | ✅ Can select
-- 2. "Admins and drivers can insert status history" | INSERT | ✅ Can insert
-- 3. "Admins and drivers can update status history" | UPDATE | ✅ Can update

