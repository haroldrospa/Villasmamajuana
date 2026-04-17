CREATE TABLE IF NOT EXISTS public.seasonal_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.00,
    villa_id UUID REFERENCES public.villas(id) ON DELETE CASCADE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.seasonal_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasonal prices are viewable by everyone."
ON public.seasonal_prices FOR SELECT
USING (true);

CREATE POLICY "Seasonal prices can be inserted by authenticated administrators."
ON public.seasonal_prices FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Seasonal prices can be updated by authenticated administrators."
ON public.seasonal_prices FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Seasonal prices can be deleted by authenticated administrators."
ON public.seasonal_prices FOR DELETE
USING (auth.role() = 'authenticated');
