-- PULSO ELEITORAL MS - RLS hardening script.
-- Review against the real Supabase project before applying.
-- Intended to be idempotent for policy creation.
-- Public browser access should read only catalogue data. Sensitive analytics
-- are served by Next.js API routes using Prisma, not by direct table reads.

ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manifestacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parametros_plataforma ENABLE ROW LEVEL SECURITY;
ALTER TABLE rodadas_metodologicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ceps_ms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de campanhas ativas" ON campanhas;
CREATE POLICY "Leitura pública de campanhas ativas"
ON campanhas FOR SELECT
USING (status = 'ativo');

DROP POLICY IF EXISTS "Leitura pública de atributos visíveis" ON atributos;
CREATE POLICY "Leitura pública de atributos visíveis"
ON atributos FOR SELECT
USING (visivel = true);

DROP POLICY IF EXISTS "Leitura pública de vínculos de atributos" ON campanha_atributos;
CREATE POLICY "Leitura pública de vínculos de atributos"
ON campanha_atributos FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Leitura pública de candidatos ativos" ON candidatos;
CREATE POLICY "Leitura pública de candidatos ativos"
ON candidatos FOR SELECT
USING (status = 'Ativo');

DROP POLICY IF EXISTS "Leitura pública de parâmetros não sensíveis" ON parametros_plataforma;
CREATE POLICY "Leitura pública de parâmetros não sensíveis"
ON parametros_plataforma FOR SELECT
USING (
  chave LIKE 'geral_%'
  OR chave LIKE 'onboarding_%'
);

DROP POLICY IF EXISTS "Leitura pública de rodadas ativas" ON rodadas_metodologicas;
CREATE POLICY "Leitura pública de rodadas ativas"
ON rodadas_metodologicas FOR SELECT
USING (status = 'ativa');

DROP POLICY IF EXISTS "Acesso restrito a manifestações" ON manifestacoes;
CREATE POLICY "Acesso restrito a manifestações"
ON manifestacoes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito a avaliações" ON avaliacoes;
CREATE POLICY "Acesso restrito a avaliações"
ON avaliacoes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito a bloqueios" ON bloqueios;
CREATE POLICY "Acesso restrito a bloqueios"
ON bloqueios FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito a logs" ON audit_logs;
CREATE POLICY "Acesso restrito a logs"
ON audit_logs FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em campanhas" ON campanhas;
CREATE POLICY "Acesso restrito de escrita em campanhas"
ON campanhas FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em atributos" ON atributos;
CREATE POLICY "Acesso restrito de escrita em atributos"
ON atributos FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em vínculos de atributos" ON campanha_atributos;
CREATE POLICY "Acesso restrito de escrita em vínculos de atributos"
ON campanha_atributos FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em candidatos" ON candidatos;
CREATE POLICY "Acesso restrito de escrita em candidatos"
ON candidatos FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em parâmetros" ON parametros_plataforma;
CREATE POLICY "Acesso restrito de escrita em parâmetros"
ON parametros_plataforma FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito de escrita em rodadas" ON rodadas_metodologicas;
CREATE POLICY "Acesso restrito de escrita em rodadas"
ON rodadas_metodologicas FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Acesso restrito a CEPs MS" ON ceps_ms;
CREATE POLICY "Acesso restrito a CEPs MS"
ON ceps_ms FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_candidatos_status_ano_cidade
ON candidatos(status, ano_eleicao, cidade);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_candidato_criado_valid
ON avaliacoes(candidato_id, criado_em, is_valid);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_atributo_criado_valid
ON avaliacoes(atributo_id, criado_em, is_valid);

CREATE INDEX IF NOT EXISTS idx_manifestacoes_candidato_criado_valid
ON manifestacoes(candidato_id, criado_em, is_valid);

CREATE INDEX IF NOT EXISTS idx_manifestacoes_ip_criado
ON manifestacoes(ip_hash, criado_em);
