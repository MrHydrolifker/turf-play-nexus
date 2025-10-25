-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'vendor', 'player');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'player',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_address TEXT,
  gstin TEXT,
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create turfs table
CREATE TABLE turfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  game_type TEXT NOT NULL,
  price_per_hour DECIMAL(10, 2) NOT NULL,
  facilities TEXT[],
  images TEXT[],
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create time slots table
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  booking_status TEXT NOT NULL DEFAULT 'confirmed',
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(user_id UUID, check_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = has_role.user_id
    AND user_roles.role = has_role.check_role
  );
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Vendors policies
CREATE POLICY "Anyone can view approved vendors"
  ON vendors FOR SELECT
  TO authenticated
  USING (approved = true OR user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create vendor profile"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Turfs policies
CREATE POLICY "Anyone can view active turfs"
  ON turfs FOR SELECT
  TO authenticated
  USING (active = true OR EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = turfs.vendor_id AND vendors.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Vendors can create turfs"
  ON turfs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = vendor_id AND vendors.user_id = auth.uid()
  ));

CREATE POLICY "Vendors can update own turfs"
  ON turfs FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM vendors WHERE vendors.id = turfs.vendor_id AND vendors.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete turfs"
  ON turfs FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Time slots policies
CREATE POLICY "Anyone can view time slots"
  ON time_slots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Vendors can manage time slots for their turfs"
  ON time_slots FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM turfs
    JOIN vendors ON vendors.id = turfs.vendor_id
    WHERE turfs.id = time_slots.turf_id
    AND vendors.user_id = auth.uid()
  ));

-- Bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM turfs
    JOIN vendors ON vendors.id = turfs.vendor_id
    WHERE turfs.id = bookings.turf_id
    AND vendors.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM turfs
    JOIN vendors ON vendors.id = turfs.vendor_id
    WHERE turfs.id = bookings.turf_id
    AND vendors.user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'));

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turfs_updated_at BEFORE UPDATE ON turfs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert mock admin user (will be created when first user signs up with this email)
-- Admin credentials: admin@gamezone.com / Admin@123

-- Insert mock vendor and data
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001'::UUID,
  'vendor@gamezone.com',
  crypt('Vendor@123', gen_salt('bf')),
  NOW(),
  '{"full_name": "Elite Sports Venue"}'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, full_name, phone, city) VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'Elite Sports Venue', '+91 98765 43210', 'Mumbai')
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001'::UUID, 'vendor')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO vendors (id, user_id, business_name, business_address, approved) VALUES
  ('00000000-0000-0000-0000-000000000002'::UUID, '00000000-0000-0000-0000-000000000001'::UUID, 'Elite Sports Venue', 'Andheri West, Mumbai, Maharashtra', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert mock turfs
INSERT INTO turfs (vendor_id, name, description, address, city, game_type, price_per_hour, facilities, images, latitude, longitude, rating, total_reviews) VALUES
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Champions Arena - PS5 Gaming Zone',
    'Premium PS5 gaming setup with latest titles, comfortable seating, and high-end gaming monitors.',
    'Shop 12, Linking Road, Andheri West',
    'Mumbai',
    'PS5',
    500.00,
    ARRAY['Latest PS5 Games', 'Comfortable Gaming Chairs', '4K Gaming Monitors', 'Air Conditioned', 'Snacks & Beverages'],
    ARRAY['https://images.unsplash.com/photo-1486401899868-0e435ed85128'],
    19.1197,
    72.8464,
    4.5,
    28
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Victory Grounds - Football Turf',
    'Professional 5-a-side and 7-a-side football turf with floodlights and quality artificial grass.',
    'Juhu Tara Road, Juhu',
    'Mumbai',
    'Football',
    1200.00,
    ARRAY['Floodlights', 'Quality Artificial Grass', 'Changing Rooms', 'Washrooms', 'Parking Available', 'First Aid Kit'],
    ARRAY['https://images.unsplash.com/photo-1529900748604-07564a03e7a6'],
    19.0990,
    72.8258,
    4.7,
    45
  ),
  (
    '00000000-0000-0000-0000-000000000002'::UUID,
    'Smash Court - Badminton Arena',
    'Indoor badminton courts with wooden flooring, professional nets, and proper lighting.',
    'Versova, Andheri West',
    'Mumbai',
    'Badminton',
    800.00,
    ARRAY['Wooden Flooring', 'Professional Nets', 'Excellent Lighting', 'Air Conditioned', 'Equipment Rental', 'Seating Area'],
    ARRAY['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea'],
    19.1310,
    72.8150,
    4.3,
    32
  );

-- Insert time slots for each turf (9 AM to 10 PM)
DO $$
DECLARE
  turf_record RECORD;
  slot_time TIME;
BEGIN
  FOR turf_record IN SELECT id FROM turfs LOOP
    FOR hour IN 9..21 LOOP
      slot_time := (hour || ':00:00')::TIME;
      INSERT INTO time_slots (turf_id, start_time, end_time, is_available)
      VALUES (turf_record.id, slot_time, (slot_time + INTERVAL '1 hour')::TIME, true);
    END LOOP;
  END LOOP;
END $$;