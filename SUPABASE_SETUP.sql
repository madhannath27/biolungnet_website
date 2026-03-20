-- ============================================================
-- BIOLUNGNET — Supabase Database Setup
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT,
  age            INTEGER,
  gender         TEXT,
  phone          TEXT,
  blood_group    TEXT,
  address        TEXT,
  medical_history TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SCANS TABLE
CREATE TABLE IF NOT EXISTS scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name       TEXT NOT NULL,
  image_url       TEXT,
  classification  TEXT NOT NULL,
  confidence      FLOAT NOT NULL,
  risk_level      TEXT NOT NULL,
  prob_normal     FLOAT DEFAULT 0,
  prob_benign     FLOAT DEFAULT 0,
  prob_malignant  FLOAT DEFAULT 0,
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "scans_select_own" ON scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scans_insert_own" ON scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "scans_update_own" ON scans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "scans_delete_own" ON scans FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKET — run separately in Supabase → Storage
--   Name: scan-images   |   Public: YES
-- ============================================================
