-- Verify Status History Setup
-- Run these queries to check if everything is set up correctly

-- 1. Check if shipment_status_history table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'shipment_status_history';

-- 2. Check existing policies on shipment_status_history
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'shipment_status_history';

-- 3. Check if table has RLS enabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'shipment_status_history';

-- 4. Check if shipments table is in realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'shipments';

-- 5. Check if shipment_status_history is in realtime publication
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'shipment_status_history';

-- 6. Check your current role
SELECT auth.uid(), auth.role();

-- 7. Check your profile role
SELECT id, role, full_name, email
FROM profiles
WHERE id = auth.uid();

