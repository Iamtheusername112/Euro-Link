# Security Guide - Euro-Link

## ⚠️ CRITICAL: Exposed Secrets Fixed

### Issue Found
The admin credentials were previously hardcoded in client-side code (`app/admin/login/page.js`), which is a **critical security vulnerability**.

### Fix Applied
- ✅ Moved admin credential verification to server-side API route (`/api/admin/verify`)
- ✅ Admin credentials now stored in environment variables only
- ✅ Client-side code no longer contains passwords

## Required Environment Variables

Add these to your `.env.local` file:

```env
# Admin Credentials (REQUIRED - Change these!)
ADMIN_EMAIL=admin@eurolink.com
ADMIN_PASSWORD=your_secure_password_here

# Supabase (Public - Safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Service Role (PRIVATE - Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend Email (PRIVATE - Server-side only)
RESEND_API_KEY=re_your_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Best Practices

### ✅ DO:
- ✅ Store all secrets in `.env.local` (never commit to git)
- ✅ Use environment variables for all API keys and passwords
- ✅ Keep `.env.local` in `.gitignore` (already configured)
- ✅ Use `NEXT_PUBLIC_` prefix only for values safe to expose client-side
- ✅ Use server-side API routes for sensitive operations
- ✅ Change default admin password immediately
- ✅ Use strong, unique passwords
- ✅ Rotate API keys regularly

### ❌ DON'T:
- ❌ Hardcode passwords or API keys in source code
- ❌ Commit `.env.local` to version control
- ❌ Share API keys or passwords publicly
- ❌ Use `NEXT_PUBLIC_` prefix for sensitive keys
- ❌ Expose service role keys in client-side code
- ❌ Use default passwords in production

## Environment Variable Security

### Public Variables (Safe for Client-Side)
These use `NEXT_PUBLIC_` prefix and are exposed to the browser:
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (designed to be public)
- `NEXT_PUBLIC_APP_URL` - Your app URL

### Private Variables (Server-Side Only)
These are **NEVER** exposed to the browser:
- `ADMIN_EMAIL` - Admin email (server-side verification only)
- `ADMIN_PASSWORD` - Admin password (server-side verification only)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin access)
- `RESEND_API_KEY` - Email API key

## Current Security Status

### ✅ Secure:
- ✅ Admin login uses server-side verification
- ✅ API keys stored in environment variables
- ✅ `.env.local` is in `.gitignore`
- ✅ Service role key only used in API routes (server-side)
- ✅ Resend API key only used in API routes (server-side)

### 🔒 Protected:
- 🔒 Admin credentials verified server-side only
- 🔒 Email sending happens server-side only
- 🔒 Database access uses proper RLS policies
- 🔒 User authentication handled by Supabase Auth

## Production Checklist

Before deploying to production:

- [ ] Change `ADMIN_EMAIL` to your production admin email
- [ ] Change `ADMIN_PASSWORD` to a strong, unique password
- [ ] Verify all environment variables are set in hosting platform
- [ ] Ensure `.env.local` is NOT committed to git
- [ ] Verify domain in Resend (for email sending)
- [ ] Update email "from" address in `lib/email.js`
- [ ] Review and update contact information in email templates
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS policies if needed
- [ ] Review Supabase RLS policies
- [ ] Set up monitoring and logging

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public issue
2. Email security concerns privately
3. Include details about the vulnerability
4. Allow time for fix before public disclosure

## Additional Security Measures

### Recommended:
- Use environment-specific configurations
- Implement rate limiting on API routes
- Add request validation and sanitization
- Use HTTPS in production
- Regular security audits
- Keep dependencies updated
- Monitor for suspicious activity

### Future Enhancements:
- Two-factor authentication for admin
- IP whitelisting for admin access
- Session timeout and refresh
- Audit logging for admin actions
- Password complexity requirements
- Account lockout after failed attempts

