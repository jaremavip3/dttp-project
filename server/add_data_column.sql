-- SQL script to add data column for binary image storage
-- Run this in Supabase Dashboard > SQL Editor

-- Add data column to store binary image data
ALTER TABLE images ADD COLUMN IF NOT EXISTS data bytea;

-- Add comment for documentation
COMMENT ON COLUMN images.data IS 'Binary image data stored as bytea';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'images' 
ORDER BY ordinal_position;
