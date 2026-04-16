-- REPARACIÓN DE ESQUEMA - VILLAS MAMAJUANA
-- Ejecuta este script en el SQL Editor de Supabase para corregir errores de conexión

-- 1. Asegurar que la columna whatsapp_number existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='business_settings' AND column_name='whatsapp_number') THEN
        ALTER TABLE business_settings ADD COLUMN whatsapp_number TEXT DEFAULT '8299735049';
    END IF;
END $$;

-- 2. Asegurar que existe al menos una fila de configuración
INSERT INTO business_settings (id, business_name, whatsapp_number)
SELECT '00000000-0000-0000-0000-000000000001', 'Villas Mamajuana', '8299735049'
WHERE NOT EXISTS (SELECT 1 FROM business_settings LIMIT 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Asegurar permisos de lectura pública (RLS)
-- Primero borramos políticas conflictivas si las hay para evitar errores
DROP POLICY IF EXISTS "Permitir lectura pública de configuración" ON business_settings;

-- Creamos la política final
CREATE POLICY "Permitir lectura pública de configuración" 
ON business_settings FOR SELECT 
TO public 
USING (true);

-- 4. Asegurar que RLS esté activado
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

-- 5. Verificar tablas de finanzas (Incomes/Expenses) por si acaso
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'incomes') THEN
        CREATE TABLE incomes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            date DATE DEFAULT CURRENT_DATE,
            category TEXT,
            description TEXT,
            amount DECIMAL,
            reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'expenses') THEN
        CREATE TABLE expenses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            date DATE DEFAULT CURRENT_DATE,
            category TEXT,
            description TEXT,
            amount DECIMAL,
            villa_id UUID REFERENCES villas(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
END $$;
