-- Create storage bucket for PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdfs', 'pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for PDF metadata
CREATE TABLE public.pdf_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pdf_documents ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view PDFs (public library)
CREATE POLICY "Anyone can view PDFs" 
ON public.pdf_documents 
FOR SELECT 
USING (true);

-- Allow anyone to upload PDFs
CREATE POLICY "Anyone can upload PDFs" 
ON public.pdf_documents 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to delete PDFs
CREATE POLICY "Anyone can delete PDFs" 
ON public.pdf_documents 
FOR DELETE 
USING (true);

-- Storage policies for PDFs bucket
CREATE POLICY "Anyone can view PDF files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs');

CREATE POLICY "Anyone can upload PDF files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs');

CREATE POLICY "Anyone can delete PDF files"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs');