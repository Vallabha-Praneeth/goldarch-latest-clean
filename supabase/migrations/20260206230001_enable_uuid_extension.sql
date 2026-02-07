-- Migration: Enable UUID extension
-- Module: FOUNDATION
-- Description: Ensure uuid-ossp extension is available for all sandbox tables

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verify extension is available
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
  ) THEN
    RAISE EXCEPTION 'uuid-ossp extension not available';
  END IF;
END $$;
