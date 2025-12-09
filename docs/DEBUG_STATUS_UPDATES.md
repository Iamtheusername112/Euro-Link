# Debug: Status Updates Not Working

## Quick Checklist

### 1. Check Browser Console (User Side)
When admin updates status, check user's browser console for:
- ✅ "Setting up real-time subscription for user shipments: [user_id]"
- ✅ "Successfully subscribed to shipment updates"
- ✅ "Shipment update received: [shipment data]"
- ❌ Any errors?

### 2. Check Browser Console (Admin Side)
When updating status, check admin's browser console for:
- ✅ "Updating shipment status: { shipmentId, oldStatus, newStatus }"
- ✅ "Shipment updated successfully: [data]"
- ✅ "Status update completed successfully"
- ❌ Any errors?

### 3. Check Server Terminal
Look for any Supabase errors or warnings

### 4. Verify Database Update
Check Supabase dashboard:
1. Go to Table Editor → `shipments`
2. Find the shipment that was updated
3. Check if `status` field actually changed
4. Check `updated_at` timestamp

### 5. Verify Realtime is Enabled
Run this in Supabase SQL Editor:
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'shipments';
```

Should return: `shipments`

If not, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;
```

### 6. Test Real-time Subscription
Open browser console on user dashboard and run:
```javascript
// Check if subscription is active
supabase.getChannels().forEach(ch => {
  console.log('Channel:', ch.topic, 'State:', ch.state)
})
```

### 7. Common Issues

#### Issue: "Subscription status: TIMED_OUT"
**Solution**: Check Supabase project settings → Realtime → Enable for `shipments` table

#### Issue: "Channel subscription error"
**Solution**: 
1. Check Supabase project is active
2. Check API keys are correct
3. Restart dev server

#### Issue: Database update succeeds but UI doesn't update
**Solution**: 
1. Check real-time subscription is active (see step 6)
2. Check browser console for subscription errors
3. Try refreshing the page

#### Issue: "Error updating shipment"
**Solution**: 
1. Check admin has proper permissions
2. Check shipment exists
3. Check console for specific error message

### 8. Manual Test

1. **Admin Side**:
   - Open admin dashboard
   - Go to Shipments tab
   - Click on a shipment
   - Change status
   - Check console for "Status update completed successfully"

2. **User Side**:
   - Open user dashboard in another browser/incognito
   - Check console for subscription messages
   - Wait for admin to update status
   - Should see "Shipment update received" in console
   - Should see toast notification
   - Status badge should update

### 9. Force Refresh Test

If real-time isn't working, try:
1. Refresh user dashboard page
2. Status should update on refresh (proves database update worked)
3. If it updates on refresh but not real-time → Realtime issue
4. If it doesn't update on refresh → Database update issue

### 10. Check Network Tab

In browser DevTools → Network tab:
- Look for WebSocket connections to Supabase
- Should see `wss://[project].supabase.co/realtime/v1/websocket`
- Check if connection is established

## Still Not Working?

1. Share browser console logs (both admin and user)
2. Share server terminal logs
3. Check Supabase dashboard → Logs for any errors
4. Verify `.env.local` has correct Supabase credentials

