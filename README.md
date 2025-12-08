# Euro-Link - Courier Package Delivery Web App

A full-stack courier package delivery web application built with Next.js and Supabase.

## 📁 Project Structure

```
euro-link/
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── calculate/         # Shipping calculator
│   ├── checkout/          # Payment checkout
│   ├── create-shipment/   # Create shipment form
│   ├── history/           # Shipment history
│   ├── profile/           # User profile
│   └── track/             # Package tracking
├── components/            # React components
│   ├── layout/           # Layout components (Header, BottomNav)
│   ├── ui/               # UI components (Cards, Banners, etc.)
│   └── icons.js          # Icon components
├── contexts/             # React contexts (AuthContext)
├── docs/                 # Documentation files
├── lib/                  # Library utilities
│   ├── utils/           # Utility functions (toast)
│   └── supabase.js      # Supabase client
├── scripts/             # Installation scripts
└── public/             # Static assets
```

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install
```

2. Set up Supabase (see `docs/SUPABASE_SETUP.md`)

3. Create `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

4. Run the app:
```bash
npm run dev
```

## 📚 Documentation

All documentation is in the `docs/` folder:
- `QUICKSTART.md` - Quick start guide
- `SUPABASE_SETUP.md` - Database setup
- `FEATURES.md` - Complete features list
- `INSTALL_INSTRUCTIONS.md` - Troubleshooting

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Language**: JavaScript (React 19)

## 📝 License

MIT License
# Euro-Link
