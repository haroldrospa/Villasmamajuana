-- Actualiza la ubicación de todas las villas existentes en la base de datos a las nuevas coordenadas
-- Extraído desde: https://maps.app.goo.gl/8NNxrmNpX4Ax5zVRA

UPDATE villas
SET location = '{
    "lat": 19.2415408,
    "lng": -70.5689804,
    "address": "Plaza Mama Juana, La Vega, República Dominicana",
    "googleMapsUrl": "https://maps.app.goo.gl/8NNxrmNpX4Ax5zVRA"
}'::jsonb;
