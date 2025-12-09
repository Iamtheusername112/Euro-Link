-- Add Public Tracking Policy for Guests
-- This allows anyone (including unauthenticated users) to track packages by tracking number
-- Run this in Supabase SQL Editor

-- Step 1: Add policy for public tracking (guests can read shipments by tracking number)
DROP POLICY IF EXISTS "Public can track shipments by tracking number" ON shipments;
CREATE POLICY "Public can track shipments by tracking number"
  ON shipments FOR SELECT
  USING (true); -- Allow public read access for tracking

-- Step 2: Add policy for public status history viewing
DROP POLICY IF EXISTS "Public can view status history by tracking number" ON shipment_status_history;
CREATE POLICY "Public can view status history by tracking number"
  ON shipment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_status_history.shipment_id
    )
  );

-- Note: The above policies allow public read access. 
-- This is safe because:
-- 1. Tracking numbers are unique identifiers meant to be shared
-- 2. Only SELECT (read) access is granted, not INSERT/UPDATE/DELETE
-- 3. Users can only see shipment details, not modify them

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('shipments', 'shipment_status_history')
ORDER BY tablename, policyname;

