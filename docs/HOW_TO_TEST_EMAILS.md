# 🧪 How to Test Email Sending

## Quick Test (2 minutes)

### Step 1: Setup Email Credentials

Add to `.env.local`:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Restart Server
```bash
npm run dev
```

### Step 3: Test Email Button

1. **Go to Admin Dashboard**: `http://localhost:3000/admin/dashboard`
2. **Click "📧 Test Email"** button (green button in top right)
3. **Enter your email address**
4. **Click "Send Test Email"**
5. **Check your inbox** (and spam folder!)

---

## Method 1: Test Email Button (Easiest)

✅ **Best for:** Quick testing, verifying configuration

1. Login as admin
2. Click the green **"📧 Test Email"** button in admin dashboard
3. Enter your email address
4. Click "Send Test Email"
5. Check your inbox for test email

**What you'll receive:**
- Subject: "🚚 Your Shipment is On the Way! - Tracking: EU-TEST123456"
- Full email template with tracking number, status, and details
- "Track Your Shipment" button

---

## Method 2: Test Real Status Update

✅ **Best for:** Testing automatic email sending

### Test Flow:

1. **Create a Test User Account**
   - Register a new account with a real email address
   - Note the email address

2. **Create a Shipment**
   - Login as the test user
   - Create a shipment
   - Note the tracking number

3. **Update Status as Admin**
   - Login as admin
   - Go to admin dashboard → Shipments tab
   - Find the test shipment
   - Click "Update Status"
   - Select a new status (e.g., "In Transit")
   - Click "Update"

4. **Check User's Email**
   - Go to the test user's email inbox
   - Check spam folder too
   - Look for email with subject containing the tracking number
   - Verify email content is correct

---

## Method 3: Test via API (Advanced)

### Using Browser Console:

1. Open browser console (F12)
2. Run this code:
```javascript
fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'your-email@example.com' })
})
.then(r => r.json())
.then(data => {
  console.log('Result:', data)
  if (data.success) {
    alert('✅ Test email sent! Check your inbox.')
  } else {
    alert('❌ Error: ' + data.error)
  }
})
```

### Using curl:
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

---

## ✅ What to Verify

### Email Configuration ✅
- [ ] Test email button works
- [ ] No errors in console
- [ ] Email arrives in inbox (or spam)

### Email Content ✅
- [ ] Subject line is correct
- [ ] Company branding (Euro-Link header) displays
- [ ] Status icon and message show correctly
- [ ] Tracking number is visible
- [ ] Shipment details are correct
- [ ] "Track Your Shipment" button works
- [ ] Contact information is present

### Automatic Sending ✅
- [ ] Status update triggers email automatically
- [ ] User receives email within seconds
- [ ] Email contains correct tracking number
- [ ] Email shows correct status
- [ ] No manual intervention needed

---

## 🔍 Troubleshooting

### Test Email Button Shows Error

**Check:**
1. `EMAIL_USER` is set in `.env.local`
2. `EMAIL_APP_PASSWORD` is set (16 characters)
3. Server was restarted after adding env vars
4. Gmail App Password is correct (not regular password)

**Common Errors:**
- "Email service not configured" → Check env vars
- "Invalid login" → Wrong App Password or 2-Step not enabled
- "Authentication failed" → Generate new App Password

### Email Not Arriving

**Check:**
1. **Spam Folder** - Gmail SMTP emails often go to spam initially
2. **Server Logs** - Look for "Email sent successfully" message
3. **Email Address** - Verify recipient email is correct
4. **Gmail Limits** - Free tier: 500 emails/day max

### Status Update Doesn't Send Email

**Check:**
1. `SUPABASE_SERVICE_ROLE_KEY` is set
2. User has email in Supabase auth.users table
3. Server logs show email sending attempt
4. Check for errors in console

---

## 📊 Complete Test Checklist

### Initial Setup
- [ ] Email credentials added to `.env.local`
- [ ] Server restarted
- [ ] Test email button works
- [ ] Test email arrives in inbox

### Real-World Test
- [ ] Create test user account
- [ ] Create test shipment
- [ ] Update status as admin
- [ ] User receives email automatically
- [ ] Email content is correct
- [ ] Tracking link works

### All Status Types
- [ ] Pending → Email sent ✅
- [ ] Paid → Email sent ✅
- [ ] Processing → Email sent ✅
- [ ] Picked Up → Email sent ✅
- [ ] In Transit → Email sent ✅
- [ ] On Route → Email sent ✅
- [ ] Out for Delivery → Email sent ✅
- [ ] Delivered → Email sent ✅

---

## 🎯 Expected Results

### When Admin Updates Status:
1. ✅ Status updates in database (instant)
2. ✅ Status history recorded (instant)
3. ✅ Notification created (instant)
4. ✅ **Email sent automatically** (within 1-2 seconds)
5. ✅ Real-time update on user dashboard (instant)
6. ✅ Toast notification on user screen (instant)

### Email Delivery:
- **Time**: Usually arrives within 5-30 seconds
- **Location**: Inbox (or spam folder initially)
- **Content**: Full template with all details
- **Links**: All links work correctly

---

## 🚀 Quick Test Steps Summary

1. **Setup** (one-time):
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-app-password
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Restart**: `npm run dev`

3. **Test**: Click "📧 Test Email" button in admin dashboard

4. **Verify**: Check inbox for test email

5. **Real Test**: Update a shipment status and verify user receives email

---

## 📝 Notes

- **Gmail SMTP**: Free, 500 emails/day limit
- **Spam Folder**: Check spam initially - Gmail SMTP emails may go there
- **Delivery Time**: Usually 5-30 seconds
- **Logs**: Check server console for "Email sent successfully" messages
- **Production**: For production, consider verifying your domain for better deliverability

---

## 🆘 Need Help?

1. Check server console logs for detailed errors
2. Verify all environment variables are set correctly
3. Test email button shows helpful error messages
4. Check Gmail account settings (2-Step Verification, App Password)
5. Try generating a new App Password if issues persist

