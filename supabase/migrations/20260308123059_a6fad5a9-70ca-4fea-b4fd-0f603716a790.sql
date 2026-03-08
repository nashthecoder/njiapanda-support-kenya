
CREATE TABLE public.partner_expressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('conductor', 'organisation', 'connect')),
  name text NOT NULL,
  organisation text,
  role text,
  zone text,
  contact_email text,
  contact_phone text,
  message text,
  extra jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_expressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit partner expressions"
  ON public.partner_expressions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all partner expressions"
  ON public.partner_expressions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partner expressions"
  ON public.partner_expressions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));
