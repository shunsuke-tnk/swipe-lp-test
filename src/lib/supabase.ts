import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Lazy-initialized client-side Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not configured');
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Legacy export for backwards compatibility (lazy)
export const supabase = {
  get client() {
    return getSupabase();
  }
};

// Server-side Supabase client (uses service role key for admin operations)
export function createServerClient(): SupabaseClient {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase environment variables not configured');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// SQL for creating tables (run this in Supabase SQL Editor)
export const SCHEMA_SQL = `
-- セッションテーブル
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visitor_id TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    device_type TEXT,
    user_agent TEXT,
    referrer TEXT,
    entry_slide TEXT,
    exit_slide TEXT,
    total_slides_viewed INTEGER DEFAULT 0
);

-- ページビューテーブル
CREATE TABLE IF NOT EXISTS page_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    slide_id TEXT NOT NULL,
    slide_type TEXT NOT NULL DEFAULT 'vertical',
    parent_slide_id TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    duration_ms INTEGER,
    scroll_direction TEXT
);

-- クリックイベントテーブル
CREATE TABLE IF NOT EXISTS click_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    slide_id TEXT NOT NULL,
    x_percent FLOAT NOT NULL,
    y_percent FLOAT NOT NULL,
    element_type TEXT,
    element_text TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- CTAクリックテーブル
CREATE TABLE IF NOT EXISTS cta_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    slide_id TEXT NOT NULL,
    cta_text TEXT NOT NULL,
    cta_action TEXT NOT NULL,
    cta_href TEXT,
    clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_visitor_id ON sessions(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_slide_id ON page_views(slide_id);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_click_events_slide_id ON click_events(slide_id);
CREATE INDEX IF NOT EXISTS idx_click_events_session_id ON click_events(session_id);
CREATE INDEX IF NOT EXISTS idx_cta_clicks_session_id ON cta_clicks(session_id);

-- Row Level Security (public insert, admin read)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cta_clicks ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous insert
CREATE POLICY "Allow anonymous insert" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous insert" ON cta_clicks FOR INSERT WITH CHECK (true);

-- Policies for service role (admin) read
CREATE POLICY "Allow service role select" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow service role select" ON page_views FOR SELECT USING (true);
CREATE POLICY "Allow service role select" ON click_events FOR SELECT USING (true);
CREATE POLICY "Allow service role select" ON cta_clicks FOR SELECT USING (true);
`;
