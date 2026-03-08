
CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount integer NOT NULL DEFAULT 0,
  contribution_count integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view contributions total"
  ON public.contributions FOR SELECT
  USING (true);

CREATE POLICY "Service role can update contributions"
  ON public.contributions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can insert contributions"
  ON public.contributions FOR INSERT
  WITH CHECK (true);

INSERT INTO public.contributions (id, total_amount, contribution_count)
VALUES ('00000000-0000-0000-0000-000000000001', 0, 0);

ALTER PUBLICATION supabase_realtime ADD TABLE public.contributions;

CREATE OR REPLACE FUNCTION public.increment_contribution(amount integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.contributions
  SET total_amount = total_amount + amount,
      contribution_count = contribution_count + 1,
      updated_at = now()
  WHERE id = '00000000-0000-0000-0000-000000000001';
$$;
