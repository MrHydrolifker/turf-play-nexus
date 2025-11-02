-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- Update existing profiles with email from auth.users
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id AND profiles.email IS NULL;

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  );
  
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'player');
  
  RETURN NEW;
END;
$function$;