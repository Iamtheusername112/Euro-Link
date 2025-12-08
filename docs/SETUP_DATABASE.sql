-- ============================================
-- COMPLETE DATABASE SETUP FOR EURO-LINK
-- Run this FIRST before creating admin account
-- ============================================

-- Step 1: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
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

-- Create policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 2: Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'Pending',
  pickup_location TEXT,
  drop_off_location TEXT,
  package_size TEXT,
  delivery_type TEXT,
  cost DECIMAL(10, 2),
  sender_info JSONB,
  recipient_info JSONB,
  package_info JSONB,
  special_instructions TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  driver_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- Create policies for shipments
DROP POLICY IF EXISTS "Users can view their own shipments" ON shipments;
CREATE POLICY "Users can view their own shipments"
  ON shipments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own shipments" ON shipments;
CREATE POLICY "Users can insert their own shipments"
  ON shipments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all shipments" ON shipments;
CREATE POLICY "Admins can view all shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

DROP POLICY IF EXISTS "Drivers can view assigned shipments" ON shipments;
CREATE POLICY "Drivers can view assigned shipments"
  ON shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Driver'
    )
  );

-- Step 3: Create shipment_status_history table
CREATE TABLE IF NOT EXISTS shipment_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT
);

-- Enable Row Level Security
ALTER TABLE shipment_status_history ENABLE ROW LEVEL SECURITY;

-- Create policy for status history
DROP POLICY IF EXISTS "Users can view status history of their shipments" ON shipment_status_history;
CREATE POLICY "Users can view status history of their shipments"
  ON shipment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = shipment_status_history.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );

-- Step 4: Create payments table
CREATE TABLE IF NOT EXISTS payments (
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

-- Create policy for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM shipments
      WHERE shipments.id = payments.shipment_id
      AND shipments.user_id = auth.uid()
    )
  );

-- Step 5: Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'status_update',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'Admin'
    )
  );

-- Step 6: Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Create function to send notification on status update
CREATE OR REPLACE FUNCTION public.notify_status_update()
RETURNS TRIGGER AS $$
DECLARE
  shipment_user_id UUID;
  status_message TEXT;
BEGIN
  -- Get the user_id from the shipment
  SELECT user_id INTO shipment_user_id
  FROM shipments
  WHERE id = NEW.shipment_id;

  -- Create notification message based on status
  CASE NEW.status
    WHEN 'In Transit' THEN
      status_message := 'Your shipment has started its journey and is now in transit.';
    WHEN 'Out for Delivery' THEN
      status_message := 'Your package is out for delivery and will arrive soon!';
    WHEN 'Delivered' THEN
      status_message := 'Your package has been delivered successfully!';
    WHEN 'Pending' THEN
      status_message := 'Your shipment is pending and awaiting processing.';
    ELSE
      status_message := 'Your shipment status has been updated to ' || NEW.status || '.';
  END CASE;

  -- Create notification for the user
  INSERT INTO notifications (user_id, shipment_id, type, title, message)
  VALUES (
    shipment_user_id,
    NEW.shipment_id,
    'status_update',
    'Shipment Status Update',
    status_message
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-send notifications on status update
DROP TRIGGER IF EXISTS on_status_update_notify ON shipment_status_history;
CREATE TRIGGER on_status_update_notify
  AFTER INSERT ON shipment_status_history
  FOR EACH ROW EXECUTE FUNCTION public.notify_status_update();

-- ============================================
-- ENABLE REALTIME FOR STATUS UPDATES
-- ============================================
-- This enables real-time synchronization between admin and user pages
-- When admin updates status, users see it instantly

-- Enable realtime for shipments table
ALTER PUBLICATION supabase_realtime ADD TABLE shipments;

-- Enable realtime for shipment_status_history table
ALTER PUBLICATION supabase_realtime ADD TABLE shipment_status_history;

-- ============================================
-- VERIFY TABLES WERE CREATED
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'shipments', 'shipment_status_history', 'payments', 'notifications')
ORDER BY table_name;

