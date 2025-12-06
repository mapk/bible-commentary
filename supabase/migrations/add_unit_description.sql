-- Add description field to chiasm_units table
ALTER TABLE chiasm_units 
ADD COLUMN IF NOT EXISTS description TEXT;

