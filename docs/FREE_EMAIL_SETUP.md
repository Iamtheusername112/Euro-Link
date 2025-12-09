# 📧 Free Email Setup Guide (No Monthly Subscription!)

## Option 1: Gmail SMTP (Recommended - Completely Free)

### Step 1: Enable Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter "Euro-Link" as the name
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this!)

### Step 2: Add to `.env.local`

```env
# Gmail SMTP Configuration (FREE - No subscription!)
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Service Role Key (for accessing user emails)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

### ✅ That's it! Emails will now be sent for free!

**Limits:**
- Gmail free tier: 500 emails/day
- Perfect for small to medium projects
- No monthly cost!

---

## Option 2: Mailgun (10,000 emails/month FREE)

If you need more than 500 emails/day, use Mailgun:

### Step 1: Sign Up for Mailgun

1. Go to [mailgun.com](https://www.mailgun.com)
2. Sign up for free account
3. Verify your email
4. Go to **Sending** > **Domain Settings**
5. Use their sandbox domain for testing (or verify your own domain)

### Step 2: Get API Key

1. Go to **Settings** > **API Keys**
2. Copy your **Private API key**

### Step 3: Install Mailgun SDK

```bash
npm install mailgun.js form-data
```

### Step 4: Update `.env.local`

```env
# Mailgun Configuration
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-domain.mailgun.org

# Supabase Service Role Key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Your app URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 5: Update `lib/email-free.js`

Replace the transporter with Mailgun configuration (see Mailgun docs).

**Free Tier:**
- 10,000 emails/month
- Perfect for larger projects
- No credit card required!

---

## Option 3: Brevo (Sendinblue) - 300 emails/day FREE

### Step 1: Sign Up

1. Go to [brevo.com](https://www.brevo.com)
2. Sign up for free account
3. Verify your email

### Step 2: Get API Key

1. Go to **Settings** > **API Keys**
2. Create new API key
3. Copy the key

### Step 3: Install Brevo SDK

```bash
npm install @getbrevo/brevo
```

### Step 4: Update `.env.local`

```env
BREVO_API_KEY=your-brevo-api-key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Free Tier:**
- 300 emails/day (9,000/month)
- Good for medium projects

---

## Current Setup: Gmail SMTP

The app is currently configured to use **Gmail SMTP** (Option 1) - completely free!

### Quick Start:

1. **Enable Gmail App Password** (see Step 1 above)
2. **Add to `.env.local`**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_APP_PASSWORD=your-16-char-app-password
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
3. **Restart server**: `npm run dev`
4. **Test**: Update a shipment status in admin dashboard

### Troubleshooting

**"Email credentials not configured"**
- Check `EMAIL_USER` and `EMAIL_APP_PASSWORD` are set
- Make sure you're using App Password, not regular password

**"Invalid login"**
- Make sure 2-Step Verification is enabled
- Use App Password, not regular password
- Check App Password is correct (16 characters)

**Emails going to spam**
- This is normal for Gmail SMTP
- Users should check spam folder
- For production, use a verified domain (Mailgun/Brevo)

---

## Comparison

| Service | Free Tier | Setup Difficulty | Best For |
|---------|-----------|------------------|----------|
| **Gmail SMTP** | 500/day | ⭐ Easy | Small projects |
| **Mailgun** | 10,000/month | ⭐⭐ Medium | Medium projects |
| **Brevo** | 300/day | ⭐⭐ Medium | Medium projects |

---

## Production Recommendation

For production, consider:
1. **Gmail SMTP** - If < 500 emails/day
2. **Mailgun** - If need more volume (10k/month free)
3. **AWS SES** - Very cheap ($0.10 per 1,000 emails)

All options are much cheaper than Resend's paid plans!

