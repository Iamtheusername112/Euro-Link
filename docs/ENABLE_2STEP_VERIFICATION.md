# How to Enable 2-Step Verification for Gmail App Passwords

## Why You Need This

Gmail requires **2-Step Verification** to be enabled before you can generate App Passwords. This is a security feature to protect your account.

## Step-by-Step Guide

### Step 1: Enable 2-Step Verification

1. **Go to your Google Account Security page:**
   - Visit: https://myaccount.google.com/security
   - Or go to: https://myaccount.google.com → Click "Security" in the left sidebar

2. **Find "2-Step Verification":**
   - Scroll down to find the "2-Step Verification" section
   - Click on it

3. **Start the setup:**
   - Click "Get started" or "Turn on"
   - You'll need your phone number

4. **Choose verification method:**
   - **Text message (SMS)** - Google will send you a code via text
   - **Phone call** - Google will call you with a code
   - **Authenticator app** - Use Google Authenticator or similar app (more secure)

5. **Complete setup:**
   - Enter the verification code when prompted
   - Click "Turn on" or "Verify"

### Step 2: Generate App Password

**After 2-Step Verification is enabled:**

1. **Go to App Passwords:**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → App passwords

2. **You should now see the App Passwords page!**

3. **Generate password:**
   - Select "Mail" from the dropdown
   - Select "Other (Custom name)"
   - Type: `Euro-Link`
   - Click "Generate"

4. **Copy the password:**
   - You'll see a 16-character password (like: `abcd efgh ijkl mnop`)
   - **Copy it immediately** - you won't be able to see it again!
   - Remove all spaces when copying (should be 16 characters total)

### Step 3: Update `.env.local`

Add to your `.env.local` file:

```env
EMAIL_USER=yourname@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Important:**
- Replace with your actual Gmail address
- Replace with the 16-character App Password (no spaces!)
- No quotes around values

### Step 4: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Alternative: If You Don't Want 2-Step Verification

If you prefer not to enable 2-Step Verification, you can use a different email service:

### Option A: Brevo (Sendinblue) - FREE
- 300 emails/day free
- No 2-Step Verification needed
- See: `docs/FREE_EMAIL_SETUP.md` → Option 3

### Option B: Mailgun - FREE
- 10,000 emails/month free
- No 2-Step Verification needed
- See: `docs/FREE_EMAIL_SETUP.md` → Option 2

---

## Troubleshooting

**"I don't see 2-Step Verification option"**
- Make sure you're logged into a personal Gmail account (not Google Workspace)
- Some accounts may have restrictions

**"I enabled 2-Step Verification but still don't see App Passwords"**
- Wait a few minutes and refresh the page
- Make sure you completed the full 2-Step Verification setup
- Try logging out and back in

**"I'm using Google Workspace (business account)"**
- App Passwords work differently for Workspace accounts
- Contact your Workspace admin or use a different email service

---

## Security Note

2-Step Verification adds an extra layer of security to your Google account. It's recommended for all accounts, not just for App Passwords!

