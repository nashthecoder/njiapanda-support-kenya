
-- Platform configuration table for alert escalation settings
CREATE TABLE public.platform_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read config
CREATE POLICY "Authenticated users can read config"
ON public.platform_config FOR SELECT TO authenticated
USING (true);

-- Only admins can insert/update config
CREATE POLICY "Admins can insert config"
ON public.platform_config FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update config"
ON public.platform_config FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Seed default escalation config
INSERT INTO public.platform_config (key, value) VALUES
('escalation_rules', '{"urgent_minutes": 30, "emergency_minutes": 60, "admin_email": ""}');
