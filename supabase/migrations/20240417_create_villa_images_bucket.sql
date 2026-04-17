-- Create storage bucket for villa images (run this in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'villa-images',
  'villa-images', 
  true,
  10485760, -- 10MB max per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view images (public bucket)
CREATE POLICY "Villa images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'villa-images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload villa images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'villa-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update villa images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'villa-images'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete villa images"  
ON storage.objects FOR DELETE
USING (
  bucket_id = 'villa-images'
  AND auth.role() = 'authenticated'
);
