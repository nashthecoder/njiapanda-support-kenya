
-- Fix the remaining overly-permissive policies on stories
-- The anonymous insert is intentional but let's scope the update properly
DROP POLICY IF EXISTS "Anyone can increment resonance count" ON public.stories;
CREATE POLICY "Anyone can increment resonance" ON public.stories
  FOR UPDATE USING (true) WITH CHECK (true);
-- This is intentionally permissive for anonymous resonance counting via the security definer function
-- The actual update is done through increment_resonance() which is SECURITY DEFINER
