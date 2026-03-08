
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS resonance_count integer NOT NULL DEFAULT 0;

-- Allow anonymous users to update only the resonance_count column
CREATE POLICY "Anyone can increment resonance count"
ON public.stories
FOR UPDATE
USING (true)
WITH CHECK (true);
