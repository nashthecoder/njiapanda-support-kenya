
-- Create stories table
CREATE TABLE public.stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  abuse_type TEXT,
  language TEXT DEFAULT 'English',
  status TEXT DEFAULT 'pending',
  source TEXT DEFAULT 'app',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  urgency TEXT NOT NULL DEFAULT 'medium',
  zone TEXT,
  resource_needed TEXT,
  consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conductors table
CREATE TABLE public.conductors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  zone TEXT,
  role TEXT,
  active BOOLEAN DEFAULT true
);

-- Create cases table
CREATE TABLE public.cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID REFERENCES public.signals(id) ON DELETE SET NULL,
  conductor_id UUID REFERENCES public.conductors(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open',
  risk_level TEXT DEFAULT 'medium',
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resources table
CREATE TABLE public.resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  zone TEXT,
  contact TEXT,
  hours TEXT,
  verified BOOLEAN DEFAULT false
);

-- Create safe_houses table
CREATE TABLE public.safe_houses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone TEXT,
  capacity_status TEXT DEFAULT 'available',
  type TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conductors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_houses ENABLE ROW LEVEL SECURITY;

-- Stories: anyone can insert (anonymous submissions), only authenticated can read
CREATE POLICY "Anyone can submit stories" ON public.stories FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view stories" ON public.stories FOR SELECT TO authenticated USING (true);

-- Signals: anyone can insert, authenticated can read
CREATE POLICY "Anyone can create signals" ON public.signals FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can view signals" ON public.signals FOR SELECT TO authenticated USING (true);

-- Cases: only authenticated users
CREATE POLICY "Authenticated users can view cases" ON public.cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert cases" ON public.cases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update cases" ON public.cases FOR UPDATE TO authenticated USING (true);

-- Conductors: public read, authenticated write
CREATE POLICY "Anyone can view conductors" ON public.conductors FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage conductors" ON public.conductors FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conductors" ON public.conductors FOR UPDATE TO authenticated USING (true);

-- Resources: public read
CREATE POLICY "Anyone can view resources" ON public.resources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage resources" ON public.resources FOR INSERT TO authenticated WITH CHECK (true);

-- Safe houses: public read
CREATE POLICY "Anyone can view safe houses" ON public.safe_houses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage safe houses" ON public.safe_houses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update safe houses" ON public.safe_houses FOR UPDATE TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_safe_houses_updated_at
  BEFORE UPDATE ON public.safe_houses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
