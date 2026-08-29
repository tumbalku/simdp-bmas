-- Migration: rename pangkat -> rank_name, golongan -> grade in EmployeeRank
-- Adds new columns, backfills from existing name column, then drops old columns.

ALTER TABLE "EmployeeRank"
  ADD COLUMN IF NOT EXISTS "rank_name" text,
  ADD COLUMN IF NOT EXISTS "grade" text;

-- Backfill: extract rank_name (Pangkat) from name formatted as "Pangkat / Golongan"
UPDATE "EmployeeRank"
SET
  "rank_name" = NULLIF(TRIM(SPLIT_PART(name, '/', 1)), ''),
  "grade"     = NULLIF(TRIM(SPLIT_PART(name, '/', 2)), '');

-- Drop old columns if they exist (idempotent via DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EmployeeRank' AND column_name = 'pangkat'
  ) THEN
    ALTER TABLE "EmployeeRank" DROP COLUMN "pangkat";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EmployeeRank' AND column_name = 'golongan'
  ) THEN
    ALTER TABLE "EmployeeRank" DROP COLUMN "golongan";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EmployeeRank' AND column_name = 'rank'
  ) THEN
    ALTER TABLE "EmployeeRank" DROP COLUMN "rank";
  END IF;
END $$;
