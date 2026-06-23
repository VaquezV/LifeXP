CREATE TABLE IF NOT EXISTS public.category_momentum (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  momentum_selfcare FLOAT NOT NULL DEFAULT 0,
  momentum_devperso FLOAT NOT NULL DEFAULT 0,
  momentum_famille  FLOAT NOT NULL DEFAULT 0,
  momentum_pro      FLOAT NOT NULL DEFAULT 0,
  trend_selfcare    TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_selfcare    IN ('up', 'down', 'stable')),
  trend_devperso    TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_devperso    IN ('up', 'down', 'stable')),
  trend_famille     TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_famille     IN ('up', 'down', 'stable')),
  trend_pro         TEXT  NOT NULL DEFAULT 'stable'
    CHECK (trend_pro         IN ('up', 'down', 'stable')),
  last_updated      DATE  NOT NULL DEFAULT CURRENT_DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT category_momentum_pkey PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS category_momentum_user_idx
  ON public.category_momentum(user_id);

ALTER TABLE public.category_momentum ENABLE ROW LEVEL SECURITY;

-- Authenticated users read/write their own row
CREATE POLICY category_momentum_select ON public.category_momentum
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY category_momentum_insert ON public.category_momentum
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_momentum_update ON public.category_momentum
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY category_momentum_delete ON public.category_momentum
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Edge function (service_role) can update any row
CREATE POLICY category_momentum_service_all ON public.category_momentum
  FOR ALL TO service_role USING (true) WITH CHECK (true);
