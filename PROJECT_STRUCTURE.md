# Euro-Link - Project Structure

## 📁 Organized Folder Architecture

```
euro-link/
├── app/                          # Next.js App Router
│   ├── admin/
│   │   └── dashboard/           # Admin/Driver unified dashboard
│   ├── api/                      # API routes
│   │   ├── calculate/           # Shipping cost calculation
│   │   ├── payments/             # Payment processing
│   │   └── shipments/            # Shipment CRUD operations
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── calculate/                # Shipping calculator page
│   ├── checkout/                 # Payment checkout page
│   ├── create-shipment/          # Create shipment form
│   ├── history/                  # Shipment history page
│   ├── profile/                  # User profile page
│   ├── track/                    # Package tracking page
│   ├── layout.js                 # Root layout
│   ├── page.js                   # Home page
│   └── globals.css               # Global styles
│
├── components/                    # React components
│   ├── layout/                   # Layout components
│   │   ├── Header.js             # Page header component
│   │   └── BottomNav.js          # Bottom navigation bar
│   ├── ui/                       # UI components
│   │   ├── ShipmentCard.js       # Shipment card component
│   │   ├── PromoBanner.js        # Promotional banner
│   │   └── Toaster.js            # Toast notification component
│   └── icons.js                  # Icon components (temporary)
│
├── contexts/                      # React contexts
│   └── AuthContext.js            # Authentication context provider
│
├── docs/                          # Documentation
│   ├── README.md                 # Project documentation
│   ├── QUICKSTART.md             # Quick start guide
│   ├── SUPABASE_SETUP.md        # Database setup instructions
│   ├── FEATURES.md               # Features documentation
│   ├── INSTALL_INSTRUCTIONS.md   # Installation troubleshooting
│   └── TEMPORARY_WORKAROUND.md   # Temporary workaround info
│
├── lib/                           # Library utilities
│   ├── utils/                     # Utility functions
│   │   └── toast.js              # Toast notification utility
│   └── supabase.js               # Supabase client configuration
│
├── scripts/                       # Installation scripts
│   ├── install-dependencies.bat  # Windows batch installer
│   └── install-packages.ps1      # PowerShell installer
│
├── public/                        # Static assets
│   └── *.svg                     # SVG icons/assets
│
├── .gitignore                     # Git ignore rules
├── jsconfig.json                  # JavaScript config
├── next.config.mjs               # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.mjs            # PostCSS configuration
└── README.md                      # Main README
```

## 📂 Folder Organization

### `/app` - Next.js App Router
- All pages and API routes
- Organized by feature/functionality
- Follows Next.js 13+ App Router conventions

### `/components` - React Components
- **`layout/`** - Layout-related components (Header, Navigation)
- **`ui/`** - Reusable UI components (Cards, Banners, etc.)
- **`icons.js`** - Icon components (temporary until lucide-react installed)

### `/contexts` - React Contexts
- Global state management
- Currently: Authentication context

### `/lib` - Library & Utilities
- **`utils/`** - Utility functions (toast notifications, helpers)
- **`supabase.js`** - Database client configuration

### `/docs` - Documentation
- All markdown documentation files
- Setup guides, features, troubleshooting

### `/scripts` - Installation Scripts
- Helper scripts for dependency installation
- Windows batch and PowerShell scripts

### `/public` - Static Assets
- Images, icons, and other static files

## 🎯 Benefits of This Structure

1. **Clear Separation** - Components organized by purpose
2. **Easy Navigation** - Logical folder hierarchy
3. **Scalable** - Easy to add new features
4. **Maintainable** - Related files grouped together
5. **Professional** - Follows industry best practices

## 📝 Import Paths

All imports use the `@/` alias configured in `jsconfig.json`:

- `@/components/layout/Header` - Layout components
- `@/components/ui/ShipmentCard` - UI components
- `@/components/icons` - Icon components
- `@/lib/utils/toast` - Utility functions
- `@/lib/supabase` - Supabase client
- `@/contexts/AuthContext` - Context providers

