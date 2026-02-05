-- Order drafts schema for logged-in users
-- Stores cart/draft data in DB for persistence across devices

-- order_drafts: one row per draft (header)
CREATE TABLE IF NOT EXISTS order_drafts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  service_type TEXT NOT NULL CHECK (service_type IN ('link', 'warehouse')),
  source_country_code TEXT NOT NULL,
  destination_country_code TEXT,
  purchased_date DATE,
  purchased_site TEXT,
  invoice_urls TEXT[],
  product_image_urls TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- order_draft_items: line items per draft
CREATE TABLE IF NOT EXISTS order_draft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID NOT NULL REFERENCES order_drafts(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_note TEXT,
  price NUMERIC(20, 4) NOT NULL,
  value_currency TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_drafts_user_id ON order_drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_order_drafts_saved_at ON order_drafts(user_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_draft_items_draft_id ON order_draft_items(draft_id);

-- RLS: users can only access their own drafts
ALTER TABLE order_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_draft_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own drafts" ON order_drafts;
CREATE POLICY "Users can manage own drafts" ON order_drafts
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own draft items" ON order_draft_items;
CREATE POLICY "Users can manage own draft items" ON order_draft_items
  FOR ALL USING (
    draft_id IN (SELECT id FROM order_drafts WHERE user_id = auth.uid())
  );
