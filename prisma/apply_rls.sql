-- Habilitar RLS em todas as tabelas
ALTER TABLE campanhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE campanha_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para Leitura Pública (SELECT)
CREATE POLICY "Leitura pública de campanhas" ON campanhas FOR SELECT USING (status = 'ativo');
CREATE POLICY "Leitura pública de atributos" ON atributos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de campanha_atributos" ON campanha_atributos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de candidatos" ON candidatos FOR SELECT USING (true);
CREATE POLICY "Leitura pública de avaliacoes" ON avaliacoes FOR SELECT USING (is_valid = true);

-- Políticas para Inserção (INSERT)
-- Avaliações: Permitir inserção anônima (será validada via API/Edge Functions)
CREATE POLICY "Inserção pública de avaliacoes" ON avaliacoes FOR INSERT WITH CHECK (true);

-- Bloqueios e Logs: Apenas serviço (service_role) tem acesso total por padrão se não houver política.
-- Mas vamos restringir explicitamente.
CREATE POLICY "Acesso restrito a bloqueios" ON bloqueios FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Acesso restrito a logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');

-- View Materializada para Performance de Resultados
DROP MATERIALIZED VIEW IF EXISTS mv_resultados_candidatos;
CREATE MATERIALIZED VIEW mv_resultados_candidatos AS
SELECT 
    a.candidato_id,
    at.nome as atributo,
    COUNT(a.id) as total,
    AVG(a.valor)::float as valor
FROM avaliacoes a
JOIN atributos at ON a.atributo_id = at.id
WHERE a.is_valid = true
GROUP BY a.candidato_id, at.nome;

CREATE INDEX idx_mv_resultados_cand ON mv_resultados_candidatos(candidato_id);
