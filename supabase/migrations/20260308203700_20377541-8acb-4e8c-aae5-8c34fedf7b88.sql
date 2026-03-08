
-- Allow admins to update resources
CREATE POLICY "Admins can update resources"
ON public.resources
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete resources
CREATE POLICY "Admins can delete resources"
ON public.resources
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete safe houses
CREATE POLICY "Admins can delete safe houses"
ON public.safe_houses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all profiles (needed for role assignment user lookup)
-- Already exists, but let's make sure admins can list profiles for user search
-- We need a way for admins to search users. Let's create a function for that.
CREATE OR REPLACE FUNCTION public.admin_search_profiles(search_term text)
RETURNS TABLE(id uuid, full_name text, zone text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.zone, p.created_at
  FROM public.profiles p
  WHERE
    has_role(auth.uid(), 'admin'::app_role)
    AND (
      p.full_name ILIKE '%' || search_term || '%'
      OR p.id::text ILIKE '%' || search_term || '%'
    )
  LIMIT 50
$$;
