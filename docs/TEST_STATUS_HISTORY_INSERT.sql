-- Test if you can insert into shipment_status_history
-- Run this while logged in as admin in Supabase SQL Editor

-- First, check your current user and role
SELECT 
  auth.uid() as current_user_id,
  (SELECT role FROM profiles WHERE id = auth.uid()) as your_role;

-- Try to insert a test record (replace with actual shipment_id from your database)
-- Get a shipment ID first:
SELECT id, tracking_number, status 
FROM shipments 
LIMIT 1;

-- Then try inserting (replace 'YOUR_SHIPMENT_ID' with actual ID from above):
-- INSERT INTO shipment_status_history (shipment_id, status, location, notes)
-- VALUES ('YOUR_SHIPMENT_ID', 'Test Status', 'Test Location', 'Test insert');

-- If this fails with a permission error, the RLS policy isn't working
-- If it succeeds, the policy is working and the issue is elsewhere

