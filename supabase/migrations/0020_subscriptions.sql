-- Layer 4.6 — Subscription management (parte neutra, no provider).
-- NB: applicare manualmente. NON eseguita automaticamente.

CREATE TABLE IF NOT EXISTS lab_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES lab_projects(id) ON DELETE CASCADE,

  setup_fee_amount DECIMAL(10,2),
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_paid_at TIMESTAMPTZ,

  monthly_amount DECIMAL(10,2) NOT NULL,
  billing_day INT DEFAULT 1,

  status TEXT CHECK (status IN ('active', 'past_due', 'suspended', 'canceled', 'trial')) DEFAULT 'active',
  next_billing_date DATE,
  last_paid_at TIMESTAMPTZ,

  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,

  grace_period_days INT DEFAULT 7,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_project ON lab_subscriptions(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON lab_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_next_billing ON lab_subscriptions(next_billing_date);

CREATE TABLE IF NOT EXISTS lab_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES lab_subscriptions(id) ON DELETE CASCADE,
  project_id UUID REFERENCES lab_projects(id),

  invoice_number TEXT,
  invoice_type TEXT CHECK (invoice_type IN ('setup', 'monthly', 'one-off')),
  amount DECIMAL(10,2) NOT NULL,

  status TEXT CHECK (status IN ('draft', 'pending', 'paid', 'failed', 'refunded')) DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_method TEXT,

  provider_invoice_id TEXT,
  provider_payment_id TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_sub ON lab_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_inv_status ON lab_invoices(status);
