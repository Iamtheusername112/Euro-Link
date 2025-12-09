-- ============================================
-- ADD PRICING TABLE FOR DYNAMIC PRICING
-- ============================================

-- Create pricing table
CREATE TABLE IF NOT EXISTS pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_size TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  express_multiplier DECIMAL(3, 2) DEFAULT 1.5,
  normal_multiplier DECIMAL(3, 2) DEFAULT 1.0,
  estimated_days_express INTEGER DEFAULT 1,
  estimated_days_normal INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

-- Create policy - everyone can read pricing
DROP POLICY IF EXISTS "Anyone can view pricing" ON pricing;
CREATE POLICY "Anyone can view pricing"
  ON pricing FOR SELECT
  USING (is_active = true);

-- Insert default pricing data
INSERT INTO pricing (package_size, base_price, express_multiplier, normal_multiplier, estimated_days_express, estimated_days_normal) VALUES
  ('1KG', 10.00, 1.5, 1.0, 1, 3),
  ('5KG', 25.00, 1.5, 1.0, 1, 3),
  ('10KG', 45.00, 1.5, 1.0, 1, 3),
  ('20KG', 80.00, 1.5, 1.0, 2, 5),
  ('50KG', 150.00, 1.5, 1.0, 2, 7)
ON CONFLICT DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pricing_package_size ON pricing(package_size);
CREATE INDEX IF NOT EXISTS idx_pricing_is_active ON pricing(is_active);

