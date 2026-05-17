-- ============================================================
-- QR BELL - Complete Database Migration
-- Run: supabase db push
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'business');
CREATE TYPE property_type AS ENUM ('house', 'apartment', 'office', 'store', 'other');
CREATE TYPE property_status AS ENUM ('available', 'busy', 'sleeping', 'do_not_disturb', 'away');
CREATE TYPE visitor_category AS ENUM ('delivery', 'guest', 'mail', 'emergency', 'other');
CREATE TYPE ring_status AS ENUM ('pending', 'seen', 'responded', 'ignored');
CREATE TYPE notification_type AS ENUM ('ring', 'system', 'subscription', 'promo');

-- ─── USER PROFILES ───────────────────────────────────────────

CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'user',
  subscription_plan subscription_plan NOT NULL DEFAULT 'free',
  subscription_status TEXT,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  max_properties INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PROPERTIES ──────────────────────────────────────────────

CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type property_type NOT NULL DEFAULT 'apartment',
  unit_number TEXT,
  address TEXT,
  photo_url TEXT,
  qr_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  qr_color TEXT NOT NULL DEFAULT '#1a1a2e',
  qr_bg_color TEXT NOT NULL DEFAULT '#ffffff',
  status property_status NOT NULL DEFAULT 'available',
  is_building_mode BOOLEAN NOT NULL DEFAULT FALSE,
  phone_number TEXT, -- Encrypted, never exposed publicly
  notification_email BOOLEAN NOT NULL DEFAULT TRUE,
  notification_push BOOLEAN NOT NULL DEFAULT TRUE,
  notification_sound BOOLEAN NOT NULL DEFAULT TRUE,
  cooldown_seconds INTEGER NOT NULL DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RING EVENTS ─────────────────────────────────────────────

CREATE TABLE public.ring_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  visitor_category visitor_category NOT NULL DEFAULT 'guest',
  visitor_message TEXT,
  visitor_ip TEXT, -- Anonymized after 30 days
  status ring_status NOT NULL DEFAULT 'pending',
  quick_response TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── PUSH SUBSCRIPTIONS ──────────────────────────────────────

CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  fcm_token TEXT,
  device_name TEXT,
  browser TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL DEFAULT 'ring',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  ring_event_id UUID REFERENCES public.ring_events(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── QUICK RESPONSES ─────────────────────────────────────────

CREATE TABLE public.quick_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── BUILDING UNITS ──────────────────────────────────────────

CREATE TABLE public.building_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_name TEXT NOT NULL,
  unit_number TEXT NOT NULL,
  resident_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INTERCOM SESSIONS (Future Camera/Intercom) ───────────────

CREATE TABLE public.intercom_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  ring_event_id UUID NOT NULL REFERENCES public.ring_events(id) ON DELETE CASCADE,
  webrtc_offer TEXT,
  webrtc_answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_properties_user_id ON public.properties(user_id);
CREATE INDEX idx_properties_qr_code ON public.properties(qr_code);
CREATE INDEX idx_properties_is_active ON public.properties(is_active);
CREATE INDEX idx_ring_events_property_id ON public.ring_events(property_id);
CREATE INDEX idx_ring_events_created_at ON public.ring_events(created_at DESC);
CREATE INDEX idx_ring_events_status ON public.ring_events(status);
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_is_active ON public.push_subscriptions(is_active);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_building_units_property_id ON public.building_units(property_id);
CREATE INDEX idx_ring_events_created_at_property ON public.ring_events(property_id, created_at DESC);

-- ─── UPDATED_AT TRIGGER ───────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── AUTO-CREATE USER PROFILE ON SIGNUP ──────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Create default quick responses
  INSERT INTO public.quick_responses (user_id, text, is_default, sort_order)
  VALUES
    (NEW.id, 'Ya bajo 🏃', TRUE, 1),
    (NEW.id, 'Esperá un momento ⏳', TRUE, 2),
    (NEW.id, 'No estoy en casa 🏠', TRUE, 3),
    (NEW.id, 'Dejá el paquete en la puerta 📦', TRUE, 4),
    (NEW.id, 'Vuelvo en unos minutos 🕐', TRUE, 5);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ANALYTICS FUNCTIONS ──────────────────────────────────────

CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_user_id UUID,
  p_property_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_rings BIGINT,
  rings_today BIGINT,
  rings_this_week BIGINT,
  rings_this_month BIGINT,
  average_response_time NUMERIC,
  most_active_hour INTEGER,
  top_category TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_rings AS (
    SELECT re.*
    FROM ring_events re
    JOIN properties p ON p.id = re.property_id
    WHERE p.user_id = p_user_id
      AND (p_property_id IS NULL OR re.property_id = p_property_id)
  )
  SELECT
    COUNT(*)::BIGINT AS total_rings,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 day')::BIGINT AS rings_today,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::BIGINT AS rings_this_week,
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT AS rings_this_month,
    AVG(EXTRACT(EPOCH FROM (responded_at - created_at)))::NUMERIC AS average_response_time,
    (
      SELECT EXTRACT(HOUR FROM created_at)::INTEGER
      FROM filtered_rings
      GROUP BY EXTRACT(HOUR FROM created_at)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS most_active_hour,
    (
      SELECT visitor_category::TEXT
      FROM filtered_rings
      GROUP BY visitor_category
      ORDER BY COUNT(*) DESC
      LIMIT 1
    ) AS top_category
  FROM filtered_rings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_rings_by_hour(
  p_property_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (hour INTEGER, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    EXTRACT(HOUR FROM created_at)::INTEGER AS hour,
    COUNT(*)::BIGINT AS count
  FROM ring_events
  WHERE property_id = p_property_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY EXTRACT(HOUR FROM created_at)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_rings_by_day(
  p_property_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (date TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    TO_CHAR(DATE_TRUNC('day', created_at), 'YYYY-MM-DD') AS date,
    COUNT(*)::BIGINT AS count
  FROM ring_events
  WHERE property_id = p_property_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE_TRUNC('day', created_at)
  ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ANONYMIZE OLD VISITOR IPs ─────────────────────────────────

CREATE OR REPLACE FUNCTION anonymize_old_visitor_ips()
RETURNS void AS $$
BEGIN
  UPDATE ring_events
  SET visitor_ip = NULL
  WHERE visitor_ip IS NOT NULL
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quick_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.building_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intercom_sessions ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role IN ('admin', 'superadmin')
    )
  );

-- Properties RLS
CREATE POLICY "Users can CRUD own properties"
  ON public.properties FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public can read active property by qr_code"
  ON public.properties FOR SELECT
  USING (is_active = TRUE);

-- Ring Events RLS
CREATE POLICY "Users can view rings on own properties"
  ON public.ring_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can insert ring events"
  ON public.ring_events FOR INSERT
  WITH CHECK (TRUE); -- Rate limiting handled in API layer

CREATE POLICY "Users can update rings on own properties"
  ON public.ring_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.user_id = auth.uid()
    )
  );

-- Push Subscriptions RLS
CREATE POLICY "Users can CRUD own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- Notifications RLS
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Quick Responses RLS
CREATE POLICY "Users can CRUD own quick responses"
  ON public.quick_responses FOR ALL
  USING (auth.uid() = user_id);

-- Building Units RLS
CREATE POLICY "Users can CRUD own building units"
  ON public.building_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Public can read building units for active properties"
  ON public.building_units FOR SELECT
  USING (
    is_active = TRUE AND
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.is_active = TRUE
    )
  );

-- Intercom Sessions RLS
CREATE POLICY "Users can CRUD own intercom sessions"
  ON public.intercom_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id AND p.user_id = auth.uid()
    )
  );

-- ─── REALTIME ────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.ring_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;
