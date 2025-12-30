-- Create a new private bucket for template assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('template-assets', 'template-assets', true);

-- Policy to allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'template-assets');

-- Policy to allow public to view images (needed for OG generation)
CREATE POLICY "Allow public read access" 
ON storage.objects 
FOR SELECT 
TO public 
USING (bucket_id = 'template-assets');

-- Policy to allow users to update/delete their own assets (optional, but good practice)
-- Assuming we stick metadata or just allow generic auth access for now for simplicity in this MVP
CREATE POLICY "Allow authenticated update/delete" 
ON storage.objects 
FOR ALL 
TO authenticated 
USING (bucket_id = 'template-assets');
