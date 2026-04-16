-- Create business_settings table for professional invoicing
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name TEXT NOT NULL,
    rnc TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo_url TEXT,
    terms TEXT DEFAULT 'Políticas de Cancelación: Reservas con 50%. Devoluciones parciales según antelación (ver contrato).',
    bank_info TEXT DEFAULT 'Banreservas - Cuenta Ahorro: 9601938364 - Harold Man',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with initial data if empty
INSERT INTO business_settings (business_name, rnc, address, phone, email)
SELECT 'Villas Mamajuana', '123-45678-9', 'Jarabacoa, La Vega, Rep. Dom.', '809-555-5555', 'info@villasmamajuana.com'
WHERE NOT EXISTS (SELECT 1 FROM business_settings);
