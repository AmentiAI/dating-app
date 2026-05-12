-- Preference Plus / Neon — initial schema
-- Run once against your Neon database (see scripts/migrate.mjs).

BEGIN;

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh on users & preferences
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  phone TEXT,
  gender TEXT,
  interested_in TEXT[],
  birthdate DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  last_active TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. profiles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  bio TEXT,
  height INTEGER,
  weight INTEGER,
  ethnicity TEXT,
  religion TEXT,
  politics TEXT,
  education TEXT,
  occupation TEXT,
  fitness_level TEXT,
  smoking_status TEXT,
  drinking_status TEXT,
  relationship_intent TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  city TEXT,
  state TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT profiles_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. profile_photos
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_photos_user_id ON public.profile_photos(user_id);

-- ---------------------------------------------------------------------------
-- 4. preferences (one row per user)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  min_age INTEGER,
  max_age INTEGER,
  min_height INTEGER,
  max_height INTEGER,
  max_distance INTEGER,
  preferred_ethnicities TEXT[],
  preferred_religions TEXT[],
  preferred_body_types TEXT[],
  preferred_relationship_types TEXT[],
  dealbreakers TEXT[],
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT preferences_user_id_key UNIQUE (user_id)
);

DROP TRIGGER IF EXISTS trg_preferences_updated_at ON public.preferences;
CREATE TRIGGER trg_preferences_updated_at
  BEFORE UPDATE ON public.preferences
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5–6. interests & user_interests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  interest_id UUID NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_interest_id ON public.user_interests(interest_id);

-- ---------------------------------------------------------------------------
-- 7. swipes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.swipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiper_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  swipe_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT swipes_no_self CHECK (swiper_id <> swiped_id)
);

CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON public.swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON public.swipes(swiped_id);
CREATE INDEX IF NOT EXISTS idx_swipes_pair ON public.swipes(swiper_id, swiped_id);

-- ---------------------------------------------------------------------------
-- 8. matches (unordered pair uniqueness)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  compatibility_score INTEGER,
  matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT matches_no_self CHECK (user1_id <> user2_id),
  CONSTRAINT matches_ordered_pair CHECK (user1_id < user2_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_matches_unique_pair ON public.matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id);

-- ---------------------------------------------------------------------------
-- 9–10. conversations & conversation_participants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);

-- ---------------------------------------------------------------------------
-- 11. messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message TEXT,
  image_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ---------------------------------------------------------------------------
-- 12. subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- ---------------------------------------------------------------------------
-- 13. boosts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  boost_start TIMESTAMPTZ,
  boost_end TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_boosts_user_id ON public.boosts(user_id);

-- ---------------------------------------------------------------------------
-- 14. reports
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_user_id);

-- ---------------------------------------------------------------------------
-- 15. blocks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self CHECK (blocker_id <> blocked_id)
);

-- ---------------------------------------------------------------------------
-- 16. notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  body TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = FALSE;

-- ---------------------------------------------------------------------------
-- 17. ai_compatibility_scores
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_compatibility_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER,
  explanation TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_compat_no_self CHECK (user1_id <> user2_id),
  CONSTRAINT ai_compat_ordered_pair CHECK (user1_id < user2_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_compat_unique_pair ON public.ai_compatibility_scores(user1_id, user2_id);

-- ---------------------------------------------------------------------------
-- 18. verification_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_verification_user ON public.verification_requests(user_id);

-- ---------------------------------------------------------------------------
-- 19. profile_views
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT profile_views_no_self CHECK (viewer_id <> viewed_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON public.profile_views(viewed_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON public.profile_views(viewer_id);

-- ---------------------------------------------------------------------------
-- 20. app_settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB
);

-- ---------------------------------------------------------------------------
-- Audit: moderation / bans (best practice)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.moderation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_target ON public.moderation_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_created ON public.moderation_audit_log(created_at DESC);

-- ---------------------------------------------------------------------------
-- Indexes from spec
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_email_active ON public.users(email) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(latitude, longitude);

COMMIT;
