# Supabase Database Setup for Euro-Link

## Required Tables

### 1. shipments
```sql
CREATE TABLE shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  pickup_location TEXT,
  drop_off_location TEXT,
  package_size TEXT,
  delivery_type TEXT,
  cost DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own shipments
CREATE POLICY "Users can view their own shipments"
  ON shipments FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own shipments
CREATE POLICY "Users can insert their own shipments"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. shipment_status_history
```sql
CREATE TABLE shipment_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view status history of their shipments"
  ON shipment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_status_history.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );
```

### 3. profiles (extends auth.users)
```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'Customer',
  packages_sent INTEGER DEFAULT 0,
  packages_received INTEGER DEFAULT 0,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 4. payments
```sql
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = payments.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );
```

### 5. Enhanced shipments table
```sql
-- Add new columns to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS sender_info JSONB;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS recipient_info JSONB;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_info JSONB;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES auth.users(id);
```

## Setup Instructions

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL commands above to create the tables
4. Copy your project URL and anon key from Settings > API
5. Create a `.env.local` file in your project root with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## Authentication (Optional)

If you want to add authentication, you can use Supabase Auth:

```bash
npm install @supabase/auth-helpers-nextjs
```

Then set up authentication pages and middleware as needed.

