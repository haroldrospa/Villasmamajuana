-- Script para añadir galería de imágenes a las villas
ALTER TABLE villas ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';

-- Comentario para documentación
COMMENT ON COLUMN villas.gallery IS 'Lista de URLs de imágenes adicionales para la galería de la villa';
