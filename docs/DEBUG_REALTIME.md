# Debugging Real-Time Updates

## Issue
Status updates from admin dashboard not appearing on user dashboard in real-time.

## Fix Applied

### Changed Behavior
- **Before**: Only updated `currentOrder` if it matched the updated shipment ID
- **After**: Always refreshes dashboard data when any shipment is updated

### Code Changes

In `app/dashboard/page.js`, the subscription now:
1. Always calls `fetchDashboardData()` when any shipment update is received
2. Shows toast notification for all status updates
3. Includes better error logging for subscription status

## Verification Steps

1. **Check Supabase Realtime is Enabled**:
   ```sql
   SELECT tablename 
   FROM pg_publication_tables 
   WHERE pubname = 'supabase_realtime' 
   AND tablename = 'shipments';
   ```

2. **Check Browser Console**:
   - Open user dashboard
   - Look for: "Successfully subscribed to shipment updates"
   - When admin updates status, look for: "Shipment update received"

3. **Test Flow**:
   - Open user dashboard in one browser
   - Open admin dashboard in another browser
   - Update status from "Pending" to "Paid"
   - User dashboard should refresh automatically

## Troubleshooting

### If updates still don't appear:

1. **Check RLS Policies**:
   - Ensure users can SELECT their own shipments
   - Check that realtime is enabled for shipments table

2. **Check Subscription Status**:
   - Look for errors in browser console
   - Check if subscription status is "SUBSCRIBED"

3. **Manual Refresh**:
   - If realtime fails, user can manually refresh page
   - Status will be correct after refresh

4. **Network Issues**:
   - Check WebSocket connection in browser DevTools
   - Verify Supabase project has realtime enabled

## Expected Behavior

When admin updates status:
1. Database update happens ✅
2. Realtime event fires ✅
3. User subscription receives update ✅
4. Dashboard refreshes automatically ✅
5. Toast notification appears ✅
6. Status badge updates ✅

