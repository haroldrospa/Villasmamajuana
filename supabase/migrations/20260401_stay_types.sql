-- Add price_pasa_dia to villas table
ALTER TABLE villas ADD COLUMN IF NOT EXISTS price_pasa_dia NUMERIC;

-- Add stay_type to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stay_type TEXT DEFAULT '24h' CHECK (stay_type IN ('10h', '24h'));

-- Update the status check constraint to include 'bloqueada'
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check CHECK (status IN ('pendiente_pago', 'pago_parcial', 'confirmada', 'cancelada', 'bloqueada'));

-- Seed some initial price_pasa_dia prices (approx 60% of regular price)
UPDATE villas SET price_pasa_dia = price * 0.6 WHERE price_pasa_dia IS NULL;
