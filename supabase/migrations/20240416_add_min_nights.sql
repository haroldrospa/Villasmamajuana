-- Add min_nights column to promotions table
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS min_nights INTEGER DEFAULT 1;

-- Update existing "Estadía Extendida" promotion if it exists to require 3 nights
UPDATE promotions 
SET min_nights = 3 
WHERE title ILIKE '%Estadía Extendida%' OR title ILIKE '%Extendida%';
