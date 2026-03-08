
CREATE OR REPLACE FUNCTION public.increment_resonance(story_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.stories
  SET resonance_count = resonance_count + 1
  WHERE id = story_id;
$$;
