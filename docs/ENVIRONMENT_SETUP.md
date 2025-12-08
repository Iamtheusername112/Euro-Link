# Environment Variables Setup

## Required Environment Variables

Your `.env.local` file should contain the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## How to Get Your Supabase Credentials

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details
5. Wait for the project to initialize (~2 minutes)

### Step 2: Get Your Project URL

1. In your Supabase dashboard, go to **Settings** (gear icon)
2. Click on **API** in the left sidebar
3. Find **Project URL** under "Project API keys"
4. Copy the URL (it looks like: `https://xxxxxxxxxxxxx.supabase.co`)

### Step 3: Get Your Anon Key

1. Still in **Settings > API**
2. Find **Project API keys** section
3. Copy the **anon/public** key (not the service_role key!)
4. It's a long string starting with `eyJ...`

### Step 4: Create .env.local File

1. In your project root directory, create a file named `.env.local`
2. Copy the template from `.env.local.example`
3. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjE2MjM5MDIyfQ.your-actual-key-here
```

## Important Notes

⚠️ **Security:**
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Never share your API keys publicly
- The `anon` key is safe for client-side use (it's public by design)
- Never use the `service_role` key in client-side code

✅ **Best Practices:**
- Use `.env.local` for local development
- Use environment variables in your hosting platform (Vercel, Netlify, etc.) for production
- Keep your `.env.local.example` file updated as a template

## Verifying Your Setup

After creating `.env.local`, restart your dev server:

```bash
npm run dev
```

If you see any errors about missing Supabase variables, double-check:
1. File is named exactly `.env.local` (not `.env.local.txt`)
2. No quotes around the values
3. No spaces around the `=` sign
4. Values are on the same line as the variable name

## Example .env.local File

Here's what a complete `.env.local` file looks like:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMn0.example-key-here
```

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env.local` exists in the project root
- Restart your dev server after creating/updating `.env.local`
- Check for typos in variable names (must be exactly as shown)

**Error: "Invalid API key"**
- Make sure you're using the `anon/public` key, not `service_role`
- Verify the key is copied completely (they're very long)
- Check for any extra spaces or line breaks

**Still having issues?**
- See `docs/QUICKSTART.md` for full setup instructions
- Check `docs/SUPABASE_SETUP.md` for database setup

