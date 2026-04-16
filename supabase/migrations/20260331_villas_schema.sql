-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum: app_role
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'client');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: user_roles
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Table: villas
CREATE TABLE IF NOT EXISTS villas (
    id TEXT PRIMARY KEY, -- Using TEXT to match your mock IDs like 'villa-1'
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    image TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    description TEXT,
    location JSONB NOT NULL DEFAULT '{"lat": 0, "lng": 0, "address": "", "googleMapsUrl": ""}',
    video_url TEXT,
    amenities TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: promotions
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    discount_percent INTEGER NOT NULL,
    villa_id TEXT REFERENCES villas(id) ON DELETE SET NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    badge TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: coupons
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    valid_to DATE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: reservations
CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    villa_id TEXT REFERENCES villas(id) NOT NULL,
    villa_name TEXT NOT NULL,
    client_id UUID REFERENCES profiles(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente_pago' CHECK (status IN ('pendiente_pago', 'pago_parcial', 'confirmada', 'cancelada')),
    total_amount NUMERIC NOT NULL,
    deposit_amount NUMERIC NOT NULL,
    remaining_amount NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('transferencia', 'pago_movil', 'efectivo')),
    receipt_image TEXT,
    payment_note TEXT,
    applied_promotion TEXT,
    applied_coupon TEXT,
    original_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: incomes
CREATE TABLE IF NOT EXISTS incomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    concept TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL,
    client TEXT,
    villa_id TEXT REFERENCES villas(id) ON DELETE SET NULL,
    income_type TEXT NOT NULL CHECK (income_type IN ('Reserva (50%)', 'Pago restante', 'Extras', 'Manual')),
    reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: expenses
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    category TEXT NOT NULL CHECK (category IN ('Limpieza', 'Mantenimiento', 'Servicios', 'Otros')),
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    villa_id TEXT REFERENCES villas(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed villas (from mock data)
INSERT INTO villas (id, name, price, image, capacity, description, location, video_url, amenities)
VALUES 
('villa-1', 'Villa Ceiba', 250, '/assets/villa-1.jpg', 6, 'Cabaña de montaña con deck privado y vistas panorámicas.', '{"lat": 19.0544, "lng": -70.5261, "address": "Jarabacoa, La Vega, República Dominicana", "googleMapsUrl": "https://maps.google.com/?q=19.0544,-70.5261"}', 'https://www.youtube.com/embed/dQw4w9WgXcQ', ARRAY['Wi-Fi', 'Cocina', 'Deck privado', 'Vista panorámica', 'BBQ']),
('villa-2', 'Villa Canopy', 320, '/assets/villa-2.jpg', 4, 'Casa del árbol de lujo rodeada de naturaleza.', '{"lat": 19.0610, "lng": -70.5320, "address": "Jarabacoa, La Vega, República Dominicana", "googleMapsUrl": "https://maps.google.com/?q=19.0610,-70.5320"}', 'https://www.youtube.com/embed/dQw4w9WgXcQ', ARRAY['Wi-Fi', 'Jacuzzi', 'Terraza elevada', 'Hamacas', 'Fogata']),
('villa-3', 'Villa Piedra', 280, '/assets/villa-3.jpg', 8, 'Villa rústica con terraza privada y comedor al aire libre.', '{"lat": 19.0480, "lng": -70.5190, "address": "Jarabacoa, La Vega, República Dominicana", "googleMapsUrl": "https://maps.google.com/?q=19.0480,-70.5190"}', NULL, ARRAY['Wi-Fi', 'Cocina completa', 'Comedor al aire libre', 'Piscina', 'Estacionamiento'])
ON CONFLICT (id) DO NOTHING;

-- Seed promotions
INSERT INTO promotions (title, description, discount_percent, valid_from, valid_to, badge, active)
VALUES 
('🔥 Oferta de Fin de Semana', '20% de descuento en todas las villas este fin de semana', 20, '2026-03-13', '2026-03-31', '-20%', true),
('🌿 Temporada Verde', '15% de descuento en Villa Canopy durante marzo', 15, '2026-03-01', '2026-03-31', '-15%', true),
('✨ Estadía Extendida', '10% de descuento en reservas de 4+ noches', 10, '2026-03-01', '2026-06-30', '-10%', true);

-- Seed coupons
INSERT INTO coupons (code, discount_percent, active, valid_to, description)
VALUES 
('MAMAJUANA10', 10, true, '2026-12-31', '10% de descuento'),
('BIENVENIDO15', 15, true, '2026-06-30', '15% de descuento para nuevos clientes'),
('VERANO20', 20, true, '2026-08-31', '20% de descuento de verano');
