# Quick Fix: Email Setup Without 2-Step Verification

If you don't want to enable 2-Step Verification on Gmail, here are **free alternatives**:

## Option 1: Brevo (Sendinblue) - Easiest! ⭐

### Setup Steps:

1. **Sign up for free account:**
   - Go to: https://www.brevo.com
   - Click "Sign up free"
   - Verify your email

2. **Get API Key:**
   - Go to: Settings → API Keys
   - Click "Generate a new API key"
   - Name it: "Euro-Link"
   - Copy the API key

3. **Update code to use Brevo:**
   - We'll need to modify `lib/email-free.js` to use Brevo instead of Gmail
   - See instructions below

**Free Tier:** 300 emails/day (9,000/month) - Perfect for most projects!

---

## Option 2: Mailgun - More Emails

### Setup Steps:

1. **Sign up:**
   - Go to: https://www.mailgun.com
   - Sign up for free account
   - Verify your email

2. **Get API Key:**
   - Go to: Settings → API Keys
   - Copy your Private API key

3. **Get Domain:**
   - Use their sandbox domain for testing (e.g., `sandbox123.mailgun.org`)
   - Or verify your own domain

**Free Tier:** 10,000 emails/month - Great for larger projects!

---

## Quick Implementation: Brevo (Recommended)

If you want to use Brevo right now, I can help you set it up. Just let me know and I'll:

1. Install the Brevo package
2. Update `lib/email-free.js` to use Brevo
3. Update your `.env.local` with Brevo credentials

**Benefits:**
- ✅ No 2-Step Verification needed
- ✅ 300 emails/day free
- ✅ Easy setup
- ✅ Professional email delivery
- ✅ Better deliverability than Gmail SMTP

---

## Current Status

Right now, your `.env.local` has:
```
EMAIL_APP_PASSWORD=Euro_12113831
```

This looks like it might be a regular password or incorrectly formatted. Gmail App Passwords are always 16 characters (like `abcdefghijklmnop`).

**To fix with Gmail:**
1. Enable 2-Step Verification (see `docs/ENABLE_2STEP_VERIFICATION.md`)
2. Generate proper App Password
3. Update `.env.local`

**To use Brevo instead:**
Just let me know and I'll set it up for you! 🚀

