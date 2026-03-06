
-- Add columns to store extracted ID data
ALTER TABLE public.user_verifications
  ADD COLUMN id_full_name TEXT,
  ADD COLUMN id_number TEXT,
  ADD COLUMN id_date_of_birth TEXT,
  ADD COLUMN id_expiry_date TEXT,
  ADD COLUMN id_image_url TEXT;

-- Create storage bucket for ID uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('id-documents', 'id-documents', false);

-- Users can upload their own ID documents
CREATE POLICY "Users can upload own ID documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own ID documents
CREATE POLICY "Users can view own ID documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
