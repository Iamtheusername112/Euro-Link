-- QUICK FIX: Run this in Supabase SQL Editor to fix RLS policy
-- This allows admins to insert status history

-- Step 1: Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins and drivers can insert status history" ON shipment_status_history;

-- Step 2: Create the INSERT policy for admins and drivers
CREATE POLICY "Admins and drivers can insert status history"
  ON shipment_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Step 3: Verify the policy was created
SELECT 
  '✅ Policy created' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'shipment_status_history'
AND cmd = 'INSERT';

-- Expected: You should see 1 row with "Admins and drivers can insert status history" | INSERT

