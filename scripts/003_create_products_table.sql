-- Create products table with support for all product types
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Common fields for all product types
  product_type TEXT NOT NULL CHECK (product_type IN ('digital', 'event', 'physical', 'appointment')),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  images TEXT[], -- Array of image URLs
  
  -- Digital product specific fields
  file_urls TEXT[], -- Array of file URLs for digital products
  license_type TEXT CHECK (license_type IN ('standard', 'extended')),
  download_limit INTEGER,
  
  -- Event specific fields
  event_date TIMESTAMP WITH TIME ZONE,
  event_location TEXT,
  is_paid_ticket BOOLEAN DEFAULT true,
  ticket_types JSONB, -- Array of {name, price, quantity}
  total_capacity INTEGER,
  
  -- Physical product specific fields
  sku TEXT,
  stock_quantity INTEGER,
  is_automated_delivery BOOLEAN DEFAULT false,
  logistics_api_key TEXT,
  shipping_locations JSONB, -- Array of {location, price}
  
  -- Appointment specific fields
  duration_minutes INTEGER,
  available_days TEXT[], -- Array of days: ['Mon', 'Tue', ...]
  start_time TIME,
  end_time TIME,
  booking_link TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own products
CREATE POLICY "Users can view own products"
ON public.products FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own products
CREATE POLICY "Users can insert own products"
ON public.products FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own products
CREATE POLICY "Users can update own products"
ON public.products FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own products
CREATE POLICY "Users can delete own products"
ON public.products FOR DELETE
USING (auth.uid() = user_id);
