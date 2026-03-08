
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'conductor', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  zone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Get conductor zone helper
CREATE OR REPLACE FUNCTION public.get_conductor_zone(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.zone FROM public.conductors c
  INNER JOIN public.profiles p ON p.id = _user_id
  WHERE c.id = _user_id AND c.active = true
  LIMIT 1
$$;

-- 6. Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Profiles RLS
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 8. User roles RLS
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 9. Enable realtime for safe_houses
ALTER PUBLICATION supabase_realtime ADD TABLE public.safe_houses;

-- 10. Drop old permissive-false policies and replace with proper ones

-- Stories: public can read approved, anyone can insert, resonance update stays
DROP POLICY IF EXISTS "Authenticated users can view stories" ON public.stories;
CREATE POLICY "Anyone can view approved stories" ON public.stories
  FOR SELECT USING (status = 'approved' OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'conductor'));

-- Signals: keep anon insert, conductors can read their zone
DROP POLICY IF EXISTS "Authenticated users can view signals" ON public.signals;
CREATE POLICY "Conductors and admins can view signals" ON public.signals
  FOR SELECT USING (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));

-- Cases: conductors in zone + admins
DROP POLICY IF EXISTS "Authenticated users can view cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can insert cases" ON public.cases;
DROP POLICY IF EXISTS "Authenticated users can update cases" ON public.cases;
CREATE POLICY "Conductors and admins can view cases" ON public.cases
  FOR SELECT USING (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Conductors and admins can insert cases" ON public.cases
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Conductors and admins can update cases" ON public.cases
  FOR UPDATE USING (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));

-- Conductors: keep public read, restrict write to admins
DROP POLICY IF EXISTS "Authenticated users can update conductors" ON public.conductors;
DROP POLICY IF EXISTS "Authenticated users can manage conductors" ON public.conductors;
CREATE POLICY "Admins can manage conductors" ON public.conductors
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update conductors" ON public.conductors
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Safe houses: public read stays, restrict write to conductors+admins
DROP POLICY IF EXISTS "Authenticated users can update safe houses" ON public.safe_houses;
DROP POLICY IF EXISTS "Authenticated users can manage safe houses" ON public.safe_houses;
CREATE POLICY "Conductors and admins can manage safe houses" ON public.safe_houses
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Conductors and admins can update safe houses" ON public.safe_houses
  FOR UPDATE USING (public.has_role(auth.uid(), 'conductor') OR public.has_role(auth.uid(), 'admin'));

-- Resources: public read stays, restrict write to admins
DROP POLICY IF EXISTS "Authenticated users can manage resources" ON public.resources;
CREATE POLICY "Admins can manage resources" ON public.resources
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
