-- Quick verification: Check if the INSERT policy exists
-- Run this to verify the policy was created

SELECT 
  policyname,
  cmd as command_type,
  CASE 
    WHEN cmd = 'INSERT' THEN '✅ INSERT Policy'
    WHEN cmd = 'SELECT' THEN '✅ SELECT Policy'
    WHEN cmd = 'UPDATE' THEN '✅ UPDATE Policy'
    ELSE cmd
  END as status
FROM pg_policies
WHERE tablename = 'shipment_status_history'
ORDER BY cmd, policyname;

-- Expected Results:
-- You should see at least:
-- 1. "Admins and drivers can insert status history" | INSERT | ✅ INSERT Policy
-- 2. "Users can view status history of their shipments" | SELECT | ✅ SELECT Policy
--
-- If you see the INSERT policy, you're all set! ✅
-- If you don't see it, the CREATE POLICY command may have failed silently

