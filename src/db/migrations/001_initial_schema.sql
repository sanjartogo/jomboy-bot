-- ============================================================
-- Jomboy Bot — Asosiy ma'lumotlar bazasi sxemasi
-- ============================================================
-- Supabase SQL Editor'da bajariladi
-- Yoki: psql $DATABASE_URL < 001_initial_schema.sql

-- 38 ta yo'nalish (master data)
CREATE TABLE IF NOT EXISTS directions (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  responsible_org TEXT,
  yearly_plan_xyus INT DEFAULT 0,
  yearly_plan_sum NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monthly_plan JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Foydalanuvchilar (mas'ullar, hokim, admin)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('masul', 'hokim', 'admin')),
  direction_ids INT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);

-- Kunlik hisobotlar (asosiy jadval)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  direction_id INT NOT NULL REFERENCES directions(id),
  report_date DATE NOT NULL,

  xyus_count INT,
  identified_sum NUMERIC(15, 2),
  collected_sum NUMERIC(15, 2),
  comment TEXT,

  source_type TEXT NOT NULL CHECK (source_type IN ('excel', 'image', 'text', 'manual')),
  source_file_url TEXT,
  raw_input TEXT,

  ai_confidence NUMERIC(3, 2) DEFAULT 1.0,
  ai_warnings TEXT[] DEFAULT '{}',
  needs_review BOOLEAN NOT NULL DEFAULT FALSE,

  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_daily_report UNIQUE(user_id, direction_id, report_date)
);

CREATE INDEX idx_reports_date ON reports(report_date DESC);
CREATE INDEX idx_reports_user_date ON reports(user_id, report_date DESC);
CREATE INDEX idx_reports_direction ON reports(direction_id);
CREATE INDEX idx_reports_needs_review ON reports(needs_review) WHERE needs_review = TRUE;

-- Kunlik AI xulosalari
CREATE TABLE IF NOT EXISTS daily_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE UNIQUE NOT NULL,

  reports_submitted INT NOT NULL DEFAULT 0,
  reports_missing INT NOT NULL DEFAULT 0,
  missing_user_ids UUID[] DEFAULT '{}',

  total_identified NUMERIC(15, 2) DEFAULT 0,
  total_collected NUMERIC(15, 2) DEFAULT 0,

  top_performers JSONB DEFAULT '[]'::jsonb,
  bottom_performers JSONB DEFAULT '[]'::jsonb,

  ai_summary TEXT,
  ai_recommendations TEXT,

  sent_to_hokim_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_summaries_date ON daily_summaries(summary_date DESC);

-- Yuborilgan xabarlar log
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered BOOLEAN NOT NULL DEFAULT TRUE,
  error_text TEXT
);

CREATE INDEX idx_notifications_user ON notifications(user_id, sent_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type, sent_at DESC);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
