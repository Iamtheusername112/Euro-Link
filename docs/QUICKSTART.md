# Quick Start Guide - Euro-Link

## 🚀 Get Running in 5 Minutes

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for the project to initialize (takes ~2 minutes)
4. Go to **SQL Editor** in your Supabase dashboard
5. Copy and paste the SQL from `docs/SUPABASE_SETUP.md` and run it
6. Go to **Settings > API**
7. Copy your **Project URL** and **anon/public key**

### Step 3: Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📱 Pages Overview

- **Home (`/`)** - Track packages, view promotions, quick actions
- **Calculate & Ship (`/calculate`)** - Calculate shipping costs
- **Track (`/track`)** - View detailed package tracking with status timeline
- **History (`/history`)** - View all past shipments
- **Profile (`/profile`)** - User profile and settings
- **Admin Dashboard (`/admin/dashboard`)** - Admin/Driver unified dashboard

## 🎨 Design Features

- Mobile-first responsive design
- Modern UI with Tailwind CSS
- Smooth animations and transitions
- Toast notifications for user feedback
- Bottom navigation for easy access

## 🔧 Next Steps

1. **Add Authentication**: Set up Supabase Auth for user login
2. **Connect Real Data**: Replace mock data with Supabase queries
3. **Add Maps**: Integrate Google Maps or Mapbox for real map views
4. **Email Notifications**: Set up email alerts for status changes
5. **Payment Integration**: Add Stripe or similar for payments

## 🐛 Troubleshooting

**Issue**: "Missing Supabase environment variables"
- **Solution**: Make sure `.env.local` exists and has both variables

**Issue**: Database errors
- **Solution**: Run the SQL setup commands from `docs/SUPABASE_SETUP.md`

**Issue**: Port 3000 already in use
- **Solution**: Run `npm run dev -- -p 3001` to use a different port

## 📚 Need Help?

Check the main `README.md` for detailed documentation.

