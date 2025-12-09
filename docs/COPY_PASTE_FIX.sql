-- ============================================
-- COPY AND PASTE THIS ENTIRE SCRIPT INTO SUPABASE SQL EDITOR
-- ============================================

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

-- Verify it worked (you should see 1 row returned)
SELECT '✅ Policy created!' as status, policyname, cmd
FROM pg_policies
WHERE tablename = 'shipment_status_history' AND cmd = 'INSERT';

