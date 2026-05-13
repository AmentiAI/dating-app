-- Server-side onboarding completion (cross-device, survives cleared local storage).
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

-- Best-effort backfill for accounts that already filled intent + bio before this column existed.
UPDATE public.users u
SET onboarding_completed_at = COALESCE(u.updated_at, u.created_at)
WHERE u.onboarding_completed_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.user_id = u.id
      AND p.relationship_intent IS NOT NULL
      AND length(trim(COALESCE(p.bio, ''))) > 0
  );
