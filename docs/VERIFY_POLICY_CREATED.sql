-- Verify that the INSERT policy was created successfully
-- Run this AFTER creating the policy

SELECT 
  policyname,
  cmd as command_type,
  CASE 
    WHEN with_check IS NOT NULL THEN 'INSERT/UPDATE allowed'
    ELSE 'SELECT only'
  END as policy_type,
  schemaname,
  tablename
FROM pg_policies
WHERE tablename = 'shipment_status_history'
ORDER BY policyname;

-- Expected output should show:
-- 1. "Users can view status history of their shipments" (SELECT)
-- 2. "Admins and drivers can insert status history" (INSERT)
-- 3. "Admins and drivers can update status history" (UPDATE) - if you created it

-- If you see all 3 policies, you're good to go!

