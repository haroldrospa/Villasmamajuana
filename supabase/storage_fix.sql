-- Script para arreglar las políticas de Storage del bucket 'media'
-- Deberías ejecutar esto en el SQL Editor de tu Supabase Dashboard

-- 1. Crear el bucket si no existe y hacerlo público
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- 2. Permitir acceso público de lectura (necesario para ver las fotos)
create policy "Media Public Access"
on storage.objects for select
using ( bucket_id = 'media' );

-- 3. Permitir a usuarios autenticados subir archivos (necesario para el admin)
create policy "Media Auth Upload"
on storage.objects for insert
with check ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- 4. Permitir a usuarios autenticados actualizar sus archivos
create policy "Media Auth Update"
on storage.objects for update
using ( bucket_id = 'media' AND auth.role() = 'authenticated' );

-- 5. Permitir a usuarios autenticados eliminar archivos
create policy "Media Auth Delete"
on storage.objects for delete
using ( bucket_id = 'media' AND auth.role() = 'authenticated' );
