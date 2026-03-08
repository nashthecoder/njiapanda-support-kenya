ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS source text DEFAULT 'app';
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';