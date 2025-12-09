# 📧 Email Testing Guide

## How to Test Email Sending

### Method 1: Test Email Button (Easiest)

1. **Go to Admin Dashboard**
   - Login as admin
   - Navigate to `/admin/dashboard`

2. **Click "📧 Test Email" Button**
   - Located in the top right of the dashboard
   - Click the green "Test Email" button

3. **Enter Your Email Address**
   - Enter the email where you want to receive the test
   - Click "Send Test Email"

4. **Check Your Inbox**
   - Check your inbox (and spam folder)
   - Look for email with subject: "🚚 Your Shipment is On the Way! - Tracking: EU-TEST123456"
   - Verify the email looks correct

### Method 2: Test via API (Advanced)

**Using curl:**
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com"}'
```

**Using browser console:**
```javascript
fetch('/api/email/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ to: 'your-email@example.com' })
})
.then(r => r.json())
.then(console.log)
```

### Method 3: Test Real Status Update

1. **Create a Test Shipment**
   - Go to admin dashboard
   - Find any existing shipment (or create one)

2. **Update Shipment Status**
   - Click on a shipment
   - Click "Update Status"
   - Select a new status (e.g., "In Transit")
   - Click "Update"

3. **Check User's Email**
   - The user who owns the shipment will receive an email automatically
   - Check their inbox for the status update email

---

## ✅ What to Verify

### Email Configuration
- [ ] Email credentials are set in `.env.local`
- [ ] Gmail App Password is correct (16 characters)
- [ ] 2-Step Verification is enabled on Gmail account

### Email Delivery
- [ ] Test email arrives in inbox (or spam)
- [ ] Email subject is correct
- [ ] Email content displays properly
- [ ] "Track Your Shipment" button works
- [ ] Links point to correct URLs

### Automatic Sending
- [ ] Status update triggers email automatically
- [ ] User receives email when admin updates status
- [ ] Email contains correct tracking number
- [ ] Email shows correct status

---

## 🔍 Troubleshooting

### "Email service not configured"
**Problem:** `EMAIL_USER` or `EMAIL_APP_PASSWORD` not set

**Solution:**
1. Check `.env.local` file exists
2. Verify both variables are set:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-16-char-app-password
   ```
3. Restart dev server: `npm run dev`

### "Invalid login" or "Authentication failed"
**Problem:** Wrong Gmail App Password

**Solution:**
1. Make sure you're using **App Password**, not regular password
2. Verify 2-Step Verification is enabled
3. Generate a new App Password:
   - Google Account → Security → App passwords
   - Create new password for "Mail"
   - Copy the 16-character password
4. Update `.env.local` and restart server

### Email Not Arriving
**Problem:** Email might be in spam or not sent

**Solution:**
1. **Check Spam Folder** - Gmail SMTP emails often go to spam initially
2. **Check Server Logs** - Look for "Email sent successfully" message
3. **Verify Email Address** - Make sure recipient email is correct
4. **Check Gmail Limits** - Gmail free tier: 500 emails/day max

### "User email not found"
**Problem:** Can't fetch user email from Supabase

**Solution:**
1. Check `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Verify user has email in Supabase auth.users table
3. Check server logs for detailed error messages

---

## 📊 Testing Checklist

### Initial Setup Test
- [ ] Test email button works
- [ ] Test email arrives in inbox
- [ ] Email template renders correctly
- [ ] Links in email work

### Real-World Test
- [ ] Create a shipment as a user
- [ ] Login as admin
- [ ] Update shipment status
- [ ] Verify user receives email automatically
- [ ] Check email content is correct
- [ ] Verify tracking link works

### Production Test
- [ ] Test with real user email addresses
- [ ] Verify emails don't go to spam (check SPF/DKIM if using custom domain)
- [ ] Test all status types send emails
- [ ] Verify email delivery rate

---

## 🎯 Expected Behavior

### When Admin Updates Status:
1. ✅ Status updates in database
2. ✅ Status history is recorded
3. ✅ Notification is created for user
4. ✅ **Email is sent automatically** ← This is what we're testing!
5. ✅ Real-time update appears on user dashboard
6. ✅ Toast notification shows on user screen

### Email Content Should Include:
- ✅ Company branding (Euro-Link header)
- ✅ Status icon and title
- ✅ Tracking number
- ✅ Current status
- ✅ Shipment details (from/to/cost)
- ✅ "Track Your Shipment" button
- ✅ Contact information

---

## 🚀 Quick Test Steps

1. **Setup** (One-time):
   ```bash
   # Add to .env.local
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-app-password
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Restart Server**:
   ```bash
   npm run dev
   ```

3. **Test Email**:
   - Go to admin dashboard
   - Click "📧 Test Email" button
   - Enter your email
   - Check inbox

4. **Test Real Flow**:
   - Update a shipment status
   - Check user's email inbox
   - Verify email received

---

## 📝 Notes

- **Gmail SMTP Limits**: 500 emails/day (free tier)
- **Spam Folder**: Gmail SMTP emails may go to spam initially
- **Production**: Consider verifying your domain for better deliverability
- **Logs**: Check server console for email sending logs

---

## 🆘 Still Having Issues?

1. Check server console logs for errors
2. Verify all environment variables are set
3. Test email button shows detailed error messages
4. Check Gmail account settings
5. Try generating a new App Password

