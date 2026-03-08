-- Create feedback type enum
CREATE TYPE public.feedback_type AS ENUM ('bug', 'contact', 'suggestion', 'other');

-- Create feedback table
CREATE TABLE public.feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type feedback_type NOT NULL DEFAULT 'other',
  message TEXT NOT NULL,
  email TEXT,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID
);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (anonymous)
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON public.feedback FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));