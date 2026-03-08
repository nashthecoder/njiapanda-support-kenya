
-- 1. Add zone column to cases
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS zone text;

-- 2. Backfill zone from linked signals
UPDATE public.cases
SET zone = s.zone
FROM public.signals s
WHERE cases.signal_id = s.id AND cases.zone IS NULL;

-- 3. Create a security definer function to get conductor zone without recursion
CREATE OR REPLACE FUNCTION public.get_my_conductor_zone()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.zone FROM public.conductors c
  WHERE c.id = auth.uid() AND c.active = true
  LIMIT 1
$$;

-- 4. Drop existing conductor/admin SELECT and UPDATE policies on cases
DROP POLICY IF EXISTS "Conductors and admins can view cases" ON public.cases;
DROP POLICY IF EXISTS "Conductors and admins can update cases" ON public.cases;
DROP POLICY IF EXISTS "Conductors and admins can insert cases" ON public.cases;

-- 5. New SELECT policy: conductors see only their zone
CREATE POLICY "Conductors can read cases in their zone"
ON public.cases FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'conductor') AND zone = get_my_conductor_zone()
);

-- 6. New UPDATE policy: conductors update only their zone
CREATE POLICY "Conductors can update cases in their zone"
ON public.cases FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'conductor') AND zone = get_my_conductor_zone()
);

-- 7. New INSERT policy: conductors insert with their zone
CREATE POLICY "Conductors can insert cases in their zone"
ON public.cases FOR INSERT TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'conductor') AND zone = get_my_conductor_zone()
);

-- 8. Admin policies — full access
CREATE POLICY "Admins can view all cases"
ON public.cases FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all cases"
ON public.cases FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert cases"
ON public.cases FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));
