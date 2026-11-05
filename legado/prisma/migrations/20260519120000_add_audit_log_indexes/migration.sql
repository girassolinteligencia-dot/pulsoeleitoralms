-- Adds indexes for operational AuditLog filtering.

CREATE INDEX IF NOT EXISTS "audit_logs_criado_em_idx" ON "audit_logs"("criado_em");
CREATE INDEX IF NOT EXISTS "audit_logs_acao_criado_em_idx" ON "audit_logs"("acao", "criado_em");
CREATE INDEX IF NOT EXISTS "audit_logs_entidade_criado_em_idx" ON "audit_logs"("entidade", "criado_em");
