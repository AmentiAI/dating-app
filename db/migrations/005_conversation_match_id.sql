-- Link conversations to matches for one thread per mutual match.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS match_id UUID UNIQUE REFERENCES public.matches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_conversations_match_id ON public.conversations(match_id);
