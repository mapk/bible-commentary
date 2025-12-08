-- Create chiasms table
CREATE TABLE IF NOT EXISTS chiasms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color_scheme JSONB, -- Optional color override
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chiasm_units table
CREATE TABLE IF NOT EXISTS chiasm_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chiasm_id UUID NOT NULL REFERENCES chiasms(id) ON DELETE CASCADE,
  unit_order INTEGER NOT NULL, -- Position in the chiasm (1, 2, 3, ...)
  verse_references JSONB NOT NULL, -- Array of verse references
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chiasms_user_id ON chiasms(user_id);
CREATE INDEX IF NOT EXISTS idx_chiasm_units_chiasm_id ON chiasm_units(chiasm_id);
CREATE INDEX IF NOT EXISTS idx_chiasm_units_order ON chiasm_units(chiasm_id, unit_order);

-- Enable Row Level Security
ALTER TABLE chiasms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chiasm_units ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chiasms
-- Users can read all chiasms (public)
CREATE POLICY "Anyone can read chiasms" ON chiasms
  FOR SELECT USING (true);

-- Users can only create their own chiasms
CREATE POLICY "Users can create their own chiasms" ON chiasms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own chiasms
CREATE POLICY "Users can update their own chiasms" ON chiasms
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own chiasms
CREATE POLICY "Users can delete their own chiasms" ON chiasms
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chiasm_units
-- Anyone can read chiasm_units (public)
CREATE POLICY "Anyone can read chiasm_units" ON chiasm_units
  FOR SELECT USING (true);

-- Users can only create units for their own chiasms
CREATE POLICY "Users can create units for their own chiasms" ON chiasm_units
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM chiasms
      WHERE chiasms.id = chiasm_units.chiasm_id
      AND chiasms.user_id = auth.uid()
    )
  );

-- Users can only update units for their own chiasms
CREATE POLICY "Users can update units for their own chiasms" ON chiasm_units
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chiasms
      WHERE chiasms.id = chiasm_units.chiasm_id
      AND chiasms.user_id = auth.uid()
    )
  );

-- Users can only delete units for their own chiasms
CREATE POLICY "Users can delete units for their own chiasms" ON chiasm_units
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chiasms
      WHERE chiasms.id = chiasm_units.chiasm_id
      AND chiasms.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_chiasms_updated_at
  BEFORE UPDATE ON chiasms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chiasm_units_updated_at
  BEFORE UPDATE ON chiasm_units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

