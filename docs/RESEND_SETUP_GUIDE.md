# 📧 Resend Email Setup Guide

## Quick Setup (5 minutes)

### Step 1: Get Resend API Key

1. Go to [resend.com](https://resend.com) and sign up (free account)
2. Verify your email address
3. Go to **API Keys** in the dashboard
4. Click **Create API Key**
5. Give it a name: "Euro-Link Production"
6. Copy the API key (starts with `re_`)

### Step 2: Get Supabase Service Role Key

1. Go to your Supabase Dashboard
2. Navigate to **Settings** > **API**
3. Find **service_role** key (NOT the anon key!)
4. Copy it

### Step 3: Add to `.env.local`

Create or update `.env.local` in your project root:

```env
# Resend API Key (from Resend dashboard)
RESEND_API_KEY=re_your_api_key_here

# Supabase Service Role Key (from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Your app URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Custom from email (defaults to onboarding@resend.dev for testing)
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### Step 4: Restart Dev Server

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Testing

1. **Update a shipment status** in admin dashboard
2. **Check the user's email inbox** - they should receive an email
3. **Check server logs** - you should see "Sending email:" logs

## Email Features

✅ **Status Update Emails** - Sent when admin updates shipment status
✅ **Driver Assignment Emails** - Sent when driver is assigned
✅ **Modern Email Template** - Responsive, branded design
✅ **Tracking Links** - Direct links to track shipment
✅ **Contact Information** - Support email, phone, website

## Using Resend's Test Domain

For **development/testing**, you can use Resend's default domain:
- `onboarding@resend.dev` - Works without domain verification
- Emails will be sent successfully
- Perfect for testing before verifying your own domain

## Production Setup

For **production**, verify your domain:

1. Go to Resend Dashboard > **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `eurolink.com`)
4. Add DNS records as instructed
5. Wait for verification (usually a few minutes)
6. Update `.env.local`:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

## Troubleshooting

### "Email service not configured"
- Check `RESEND_API_KEY` is set in `.env.local`
- Restart dev server after adding

### "User email not found"
- Check `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify user has email in Supabase auth.users table

### Emails not arriving
- Check Resend dashboard > **Logs** for delivery status
- Check spam folder
- Verify email address is correct
- Check server logs for errors

### 404 Error on Email Route
- Make sure `app/api/email/send-status-update/route.js` exists
- Restart dev server
- Check Next.js compilation errors

## Email Template Customization

Edit `lib/email.js` to customize:
- Company colors
- Contact information
- Email content
- Branding

## Support

- **Resend Docs**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Check Logs**: Server console and Resend dashboard

