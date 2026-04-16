-- =========================================
-- FIX: Enable admin write access to villas
-- =========================================

-- Add gallery column if it doesn't exist
ALTER TABLE public.villas 
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- Enable Row Level Security
ALTER TABLE public.villas ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist to start fresh
DROP POLICY IF EXISTS "Anyone can read villas" ON public.villas;
DROP POLICY IF EXISTS "Admins can insert villas" ON public.villas;
DROP POLICY IF EXISTS "Admins can update villas" ON public.villas;
DROP POLICY IF EXISTS "Admins can delete villas" ON public.villas;

-- Allow EVERYONE to read villas (public data)
CREATE POLICY "Anyone can read villas"
ON public.villas FOR SELECT
USING (true);

-- Allow admins to INSERT new villas
CREATE POLICY "Admins can insert villas"
ON public.villas FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to UPDATE villas
CREATE POLICY "Admins can update villas"
ON public.villas FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to DELETE villas
CREATE POLICY "Admins can delete villas"
ON public.villas FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
