-- Add whatsapp_number to business_settings
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS whatsapp_number TEXT DEFAULT '8299735049';

-- Update existing data if any
UPDATE business_settings SET whatsapp_number = '8299735049' WHERE whatsapp_number IS NULL;
