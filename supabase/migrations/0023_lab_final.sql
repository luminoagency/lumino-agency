-- Layer 6 — Ottimizzazioni finali (dopo 0018–0022).
-- NB: applicare manualmente. NON eseguita automaticamente.

-- Indici su query frequenti.
CREATE INDEX IF NOT EXISTS idx_projects_step ON lab_projects(current_step);
CREATE INDEX IF NOT EXISTS idx_projects_updated ON lab_projects(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_business_type ON lab_projects(business_type);

-- View di health per audit/monitoraggio (richiede 0019 + 0020 + 0022 applicate).
CREATE OR REPLACE VIEW lab_projects_health AS
SELECT
  p.id, p.business_name, p.business_type, p.current_step, p.status,
  p.published_url, p.published_at,
  s.status AS subscription_status, s.monthly_amount,
  (SELECT COUNT(*) FROM lab_project_messages WHERE project_id = p.id AND status = 'new') AS new_messages,
  (SELECT COUNT(*) FROM lab_client_users WHERE project_id = p.id) AS client_users_count
FROM lab_projects p
LEFT JOIN lab_subscriptions s ON s.project_id = p.id;
