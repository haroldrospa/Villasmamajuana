-- ARREGLO DE PERMISOS (RLS) - VILLAS MAMAJUANA
-- Ejecuta esto en el SQL Editor de Supabase para permitir que los clientes confirmen sus reservas

-- 1. Permitir que CUALQUIER persona vea las villas (público)
-- Esto soluciona el error "Error fetching villas" en la consola
DROP POLICY IF EXISTS "Public Read Villas" ON villas;
DROP POLICY IF EXISTS "Permitir lectura pública de villas" ON villas;
CREATE POLICY "Permitir lectura pública de villas" 
ON villas FOR SELECT 
TO public 
USING (true);

-- 2. Asegurar que RLS esté activo en villas
ALTER TABLE villas ENABLE ROW LEVEL SECURITY;

-- 3. Permitir que los clientes ACTUALICEN sus propias reservas (para subir el pago)
-- Nota: Usamos auth.uid() para verificar que el usuario logueado es el dueño de la reserva
DROP POLICY IF EXISTS "Users can update own reservations" ON reservations;
DROP POLICY IF EXISTS "Clientes pueden actualizar su propia reserva" ON reservations;
CREATE POLICY "Clientes pueden actualizar su propia reserva" 
ON reservations FOR UPDATE 
TO authenticated 
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- 4. Permitir que los clientes LEAN sus propias reservas (para ver sus facturas)
DROP POLICY IF EXISTS "Users can view own reservations" ON reservations;
DROP POLICY IF EXISTS "Clientes pueden ver su propia reserva" ON reservations;
CREATE POLICY "Clientes pueden ver su propia reserva" 
ON reservations FOR SELECT 
TO authenticated 
USING (auth.uid() = client_id);

-- 5. Permitir que los administradores vean y actualicen TODO
DROP POLICY IF EXISTS "Admins can do everything on reservations" ON reservations;
CREATE POLICY "Admins can do everything on reservations" 
ON reservations FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- 6. Asegurar permisos en business_settings (re-confirmación)
DROP POLICY IF EXISTS "Read business settings" ON business_settings;
CREATE POLICY "Read business settings" ON business_settings FOR SELECT TO public USING (true);
