# Email Setup with Resend

## Overview
Euro-Link uses Resend for sending email notifications to users when shipment status changes or drivers are assigned.

## Setup Instructions

### 1. Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "Euro-Link Production")
4. Copy the API key (starts with `re_`)

### 3. Verify Your Domain (Optional but Recommended)
For production, you should verify your domain:
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `eurolink.com`)
4. Follow the DNS setup instructions
5. Once verified, update the `from` email in `lib/email.js`:
   ```javascript
   from: 'Euro-Link <noreply@yourdomain.com>'
   ```

### 4. Configure Environment Variables

Add to your `.env.local` file:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Supabase Service Role Key (for accessing user emails)
# Get this from Supabase Dashboard > Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Your app URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**For Production:**
- Add these variables to your hosting platform (Vercel, Netlify, etc.)
- Never commit `.env.local` to version control

### 5. Get Supabase Service Role Key
1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Find **service_role** key (NOT the anon key!)
4. Copy it and add to `.env.local` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Important:** The service_role key has admin access. Never expose it in client-side code!

## Email Features

### Status Update Emails
Users receive emails when:
- Shipment status changes (Pending → In Transit → Delivered, etc.)
- Payment is confirmed
- Package is out for delivery
- Package is delivered

### Driver Assignment Emails
Users receive emails when:
- A driver is assigned to their shipment

## Email Template

The email template includes:
- ✅ Modern, responsive design
- ✅ Company branding (Euro-Link orange theme)
- ✅ Tracking number display
- ✅ Status information
- ✅ Shipment details
- ✅ "Track Your Shipment" button
- ✅ Company contact information:
  - Email: support@eurolink.com
  - Phone: +1 (234) 567-890
  - Website: www.eurolink.com

## Testing

### Test Email Sending
1. Make sure `RESEND_API_KEY` is set in `.env.local`
2. Update a shipment status in the admin dashboard
3. Check the user's email inbox
4. Check server logs for any errors

### Using Resend Test Mode
Resend provides a test mode that doesn't send real emails:
- Test emails go to a test inbox in Resend dashboard
- Useful for development without spamming users

## Troubleshooting

### Emails Not Sending
1. **Check API Key**: Verify `RESEND_API_KEY` is correct
2. **Check Service Role Key**: Verify `SUPABASE_SERVICE_ROLE_KEY` is set
3. **Check User Email**: Ensure user has a valid email in auth.users
4. **Check Logs**: Look for errors in server console
5. **Resend Dashboard**: Check Resend dashboard for delivery status

### "Email service not configured" Warning
- This appears if `RESEND_API_KEY` is missing
- Emails won't be sent, but the app will continue to work
- Status updates and notifications will still work in-app

### "User email not found" Error
- User might not have an email in auth.users
- Check Supabase auth.users table
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly

## Customization

### Update Contact Information
Edit `lib/email.js` and update the footer section:
```javascript
<a href="mailto:support@eurolink.com">📧 support@eurolink.com</a>
<a href="tel:+1234567890">📞 +1 (234) 567-890</a>
<a href="https://eurolink.com">🌐 www.eurolink.com</a>
```

### Update Email From Address
In `lib/email.js`, update:
```javascript
from: 'Euro-Link <noreply@yourdomain.com>'
```

### Customize Email Template
Edit the `EmailTemplate` component in `lib/email.js` to match your brand colors and style.

## Production Checklist

- [ ] Resend API key added to production environment
- [ ] Supabase service role key added to production environment
- [ ] Domain verified in Resend (recommended)
- [ ] Email "from" address updated to verified domain
- [ ] Contact information updated in email template
- [ ] App URL updated in environment variables
- [ ] Test emails sent and verified

## Support

For Resend support:
- Documentation: https://resend.com/docs
- Support: support@resend.com

For Euro-Link email issues:
- Check server logs
- Verify environment variables
- Test with Resend dashboard

