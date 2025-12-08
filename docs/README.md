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

## Features

- 📦 **Package Tracking** - Track your packages with real-time status updates
- 🚚 **Calculate & Ship** - Calculate shipping costs based on package size and delivery type
- 📋 **Shipment History** - View all your past and current shipments
- 👤 **User Profile** - Manage your profile and view statistics
- 🔔 **Notifications** - Stay updated with shipment notifications
- 💳 **Payment Processing** - Secure checkout flow
- 🚚 **Driver Dashboard** - Manage deliveries and update status
- 👨‍💼 **Admin Dashboard** - Analytics and management

## Quick Start

See `docs/QUICKSTART.md` for detailed setup instructions.

## Documentation

- `QUICKSTART.md` - Quick start guide
- `SUPABASE_SETUP.md` - Database setup instructions
- `FEATURES.md` - Complete features list
- `INSTALL_INSTRUCTIONS.md` - Installation troubleshooting

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React (temporary custom icons)
- **Notifications**: Sonner (temporary custom toast)
- **Language**: JavaScript (React 19)

## License

MIT License

