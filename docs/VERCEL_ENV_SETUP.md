# Setting Up Environment Variables in Vercel

## Problem
The email template is using `localhost:3000` instead of your production URL because `NEXT_PUBLIC_APP_URL` is not set in Vercel.

## Solution

### Step 1: Get Your Vercel URL

Your Vercel app URL should look like:
- `https://your-app-name.vercel.app`
- Or your custom domain: `https://yourdomain.com`

### Step 2: Add Environment Variable in Vercel

1. **Go to your Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your project (euro-link)

2. **Go to Settings:**
   - Click on your project
   - Click "Settings" in the top menu
   - Click "Environment Variables" in the left sidebar

3. **Add the Variable:**
   - **Key:** `NEXT_PUBLIC_APP_URL`
   - **Value:** Your production URL (e.g., `https://your-app-name.vercel.app`)
   - **Environment:** Select all (Production, Preview, Development)
   - Click "Save"

### Step 3: Redeploy

After adding the environment variable:

1. **Option A: Automatic Redeploy**
   - Vercel will automatically redeploy when you push to your main branch
   - Or trigger a redeploy manually:
     - Go to "Deployments" tab
     - Click the "..." menu on the latest deployment
     - Click "Redeploy"

2. **Option B: Manual Redeploy**
   - Make a small change to your code and push
   - Or use Vercel CLI: `vercel --prod`

### Step 4: Verify

After redeploying, test sending an email:
1. Go to Admin Dashboard
2. Click "Test Email"
3. Send a test email
4. Check the email - the "Track Your Shipment" button should now point to your Vercel URL

---

## All Required Environment Variables for Vercel

Make sure you have these set in Vercel:

```env
# Your Production URL
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app

# Gmail Email Configuration (or Brevo/Mailgun)
EMAIL_USER=yourname@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin Credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
```

---

## Quick Setup Checklist

- [ ] Added `NEXT_PUBLIC_APP_URL` to Vercel environment variables
- [ ] Set value to your production URL (e.g., `https://your-app.vercel.app`)
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed the application
- [ ] Tested email sending - button should now work!

---

## Troubleshooting

**Button still shows localhost:3000?**
- Make sure you redeployed after adding the environment variable
- Check that `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
- Verify the variable is available in Production environment

**How to check if variable is set:**
- In Vercel Dashboard → Settings → Environment Variables
- You should see `NEXT_PUBLIC_APP_URL` listed
- Make sure it's enabled for "Production"

**Using a custom domain?**
- Set `NEXT_PUBLIC_APP_URL` to your custom domain: `https://yourdomain.com`
- Make sure your domain is properly configured in Vercel

