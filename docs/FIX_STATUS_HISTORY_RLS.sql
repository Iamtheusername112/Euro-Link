-- Fix RLS Policy for shipment_status_history table
-- This allows admins and drivers to insert status history

-- First, verify the table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'shipment_status_history'
    ) THEN
        RAISE EXCEPTION 'Table shipment_status_history does not exist. Please run SETUP_DATABASE.sql first.';
    END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view status history of their shipments" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins can insert status history" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins and drivers can insert status history" ON shipment_status_history;
DROP POLICY IF EXISTS "Admins and drivers can update status history" ON shipment_status_history;

-- Ensure RLS is enabled
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view status history of their shipments
CREATE POLICY "Users can view status history of their shipments"
  ON shipment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_status_history.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );

-- Allow admins and drivers to insert status history
CREATE POLICY "Admins and drivers can insert status history"
  ON shipment_status_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Allow admins and drivers to update status history (if needed)
CREATE POLICY "Admins and drivers can update status history"
  ON shipment_status_history FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'Admin' OR profiles.role = 'Driver')
    )
  );

-- Verify policies were created
SELECT 
  policyname,
  cmd,
  CASE WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE allowed' ELSE 'SELECT only' END as policy_type
FROM pg_policies
WHERE tablename = 'shipment_status_history'
ORDER BY policyname;

