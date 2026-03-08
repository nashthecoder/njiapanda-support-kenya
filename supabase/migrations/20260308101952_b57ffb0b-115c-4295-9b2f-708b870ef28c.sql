
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS swahili_text text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS tags text[];
