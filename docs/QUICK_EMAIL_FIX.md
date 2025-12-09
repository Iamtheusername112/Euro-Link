# Quick Email Setup Fix

## Current Error
```
Gmail authentication failed. Invalid username or password.
535-5.7.8 Username and Password not accepted
```

## Step-by-Step Fix

### 1. Enable 2-Step Verification
- Go to: https://myaccount.google.com/security
- Click "2-Step Verification"
- Follow the setup process (you'll need your phone)

### 2. Generate App Password
- Go to: https://myaccount.google.com/apppasswords
- If you don't see "App passwords", make sure 2-Step Verification is enabled first
- Select "Mail" from the dropdown
- Select "Other (Custom name)"
- Type: `Euro-Link`
- Click "Generate"
- **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)
- ⚠️ **Important**: Remove all spaces when copying (should be 16 characters total)

### 3. Create/Update `.env.local` File

Create a file named `.env.local` in your project root (same folder as `package.json`):

```env
# Gmail Email Configuration
EMAIL_USER=yourname@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Replace:**
- `yourname@gmail.com` with your actual Gmail address
- `abcdefghijklmnop` with your 16-character App Password (no spaces!)

### 4. Verify Your `.env.local` File

Your `.env.local` should look exactly like this (with your actual values):

```env
EMAIL_USER=john.doe@gmail.com
EMAIL_APP_PASSWORD=abcd efgh ijkl mnop
```

**OR** (spaces removed):

```env
EMAIL_USER=john.doe@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

**Common Mistakes:**
- ❌ Using your regular Gmail password instead of App Password
- ❌ Including quotes around the values: `EMAIL_USER="yourname@gmail.com"` (don't use quotes)
- ❌ Having spaces in EMAIL_USER
- ❌ Not restarting the dev server after changing .env.local
- ❌ Using the wrong email address

### 5. Restart Your Dev Server

**IMPORTANT**: After changing `.env.local`, you MUST restart your dev server:

1. Stop the server: Press `Ctrl+C` in the terminal
2. Start it again: `npm run dev`

### 6. Test Again

1. Go to Admin Dashboard
2. Click "Test Email" button
3. Enter your email address
4. Click "Send Test Email"

## Verification Checklist

- [ ] 2-Step Verification is enabled on Gmail
- [ ] App Password is generated (16 characters)
- [ ] `.env.local` file exists in project root
- [ ] `EMAIL_USER` is set to your full Gmail address (no quotes)
- [ ] `EMAIL_APP_PASSWORD` is set to 16-character App Password (no quotes, no spaces)
- [ ] Dev server has been restarted after changes
- [ ] Test email is sent successfully

## Still Not Working?

### Check Your `.env.local` Format
Make sure it looks exactly like this (no extra spaces, no quotes):

```env
EMAIL_USER=test@gmail.com
EMAIL_APP_PASSWORD=abcdefghijklmnop
```

### Verify Environment Variables Are Loaded
Add this temporarily to check (then remove it):

In `lib/email-free.js`, add at the top:
```javascript
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET')
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'SET (length: ' + process.env.EMAIL_APP_PASSWORD.length + ')' : 'NOT SET')
```

Check the server console (not browser console) to see if the variables are loaded.

### Common Issues

1. **"EMAIL_USER is NOT SET"**
   - Check `.env.local` file exists
   - Check spelling: `EMAIL_USER` (not `EMAIL_USERNAME`)
   - Restart dev server

2. **"EMAIL_APP_PASSWORD is NOT SET"**
   - Check `.env.local` file exists
   - Check spelling: `EMAIL_APP_PASSWORD` (exact spelling)
   - Restart dev server

3. **"Password length is not 16"**
   - Make sure you copied the full App Password
   - Remove any spaces
   - Generate a new App Password if needed

4. **Still getting 535 error**
   - Double-check you're using App Password, not regular password
   - Verify 2-Step Verification is enabled
   - Try generating a new App Password
   - Make sure `.env.local` is in the project root (not in a subfolder)

## Need More Help?

Check the full setup guide: `docs/FREE_EMAIL_SETUP.md`

