-- Fix RLS policy to allow users to insert their own roles during signup
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;

CREATE POLICY "Users can insert own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure the handle_new_user function doesn't conflict
-- The trigger adds 'player' role by default, but we also allow manual insertion
-- This allows vendors and admins to be created properly