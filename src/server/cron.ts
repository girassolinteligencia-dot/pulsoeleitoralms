// Tarefas agendadas (Cron Triggers do Workers). Sem dependências do Next:
// é importado direto pelo worker de entrada (worker.ts).
import type { D1Database } from "@cloudflare/workers-types";

export type CronEnv = {
  DB: D1Database;
  AUDIT_LOG_RETENTION_DAYS?: string;
  PROFILE_RETENTION_DAYS?: string;
};

const ALVO = `case when candidato_id is not null then 'candidato' when orgao_id is not null then 'orgao' else 'servico' end`;
const ALVO_ID = `coalesce(candidato_id, orgao_id, servico_id)`;
// Campo Grande (MS): UTC-4 o ano todo
const DIA_MS = `date(criado_em / 1000, 'unixepoch', '-4 hours')`;

/** Recalcula as tabelas de resumo a partir dos registros válidos (substituição atômica). */
export async function atualizarResumos(db: D1Database) {
  const agora = Date.now();
  await db.batch([
    db.prepare("delete from resumo_alvo"),
    db
      .prepare(
        `
      insert into resumo_alvo (alvo_tipo, alvo_id, total_manifestacoes, aprovacoes, desaprovacoes,
                               expectativa_sim, expectativa_nao, total_avaliacoes, saldo_atributos, atualizado_em)
      select m.tipo, m.id, m.n, m.ap, m.de, m.es, m.en, coalesce(a.n, 0), coalesce(a.saldo, 0), ?1
      from (
        select ${ALVO} tipo, ${ALVO_ID} id, count(*) n,
               total(aprovacao = 1) ap, total(aprovacao = 0) de,
               total(expectativa_vitoria = 1) es, total(expectativa_vitoria = 0) en
        from manifestacoes where is_valid = 1 and ${ALVO_ID} is not null group by 1, 2
      ) m
      left join (
        select ${ALVO} tipo, ${ALVO_ID} id, count(*) n, total(valor) saldo
        from avaliacoes where is_valid = 1 and ${ALVO_ID} is not null group by 1, 2
      ) a on a.tipo = m.tipo and a.id = m.id`,
      )
      .bind(agora),
    db.prepare("delete from resumo_atributo"),
    db.prepare(`
      insert into resumo_atributo (alvo_tipo, alvo_id, atributo_id, positivos, negativos)
      select ${ALVO}, ${ALVO_ID}, atributo_id, total(valor > 0), total(valor < 0)
      from avaliacoes where is_valid = 1 and ${ALVO_ID} is not null group by 1, 2, 3`),
    db.prepare("delete from resumo_diario"),
    db.prepare(`
      insert into resumo_diario (dia, alvo_tipo, manifestacoes, avaliacoes)
      select d.dia, d.tipo, d.n, coalesce(a.n, 0) from (
        select ${DIA_MS} dia, ${ALVO} tipo, count(*) n from manifestacoes where is_valid = 1 group by 1, 2
        union all
        select ${DIA_MS}, 'total', count(*) from manifestacoes where is_valid = 1 group by 1
      ) d left join (
        select ${DIA_MS} dia, ${ALVO} tipo, count(*) n from avaliacoes where is_valid = 1 group by 1, 2
        union all
        select ${DIA_MS}, 'total', count(*) from avaliacoes where is_valid = 1 group by 1
      ) a on a.dia = d.dia and a.tipo = d.tipo`),
    db.prepare("delete from resumo_territorio"),
    db.prepare(`
      insert into resumo_territorio (cidade, bairro, alvo_tipo, manifestacoes, aprovacoes, desaprovacoes)
      select json_extract(perfil, '$.cidade'), coalesce(json_extract(perfil, '$.bairro'), ''), ${ALVO},
             count(*), total(aprovacao = 1), total(aprovacao = 0)
      from manifestacoes
      where is_valid = 1 and json_extract(perfil, '$.cidade') is not null and json_extract(perfil, '$.cidade') <> ''
      group by 1, 2, 3`),
  ]);
}

const diasMinimo = (v: string | undefined, padrao: number, minimo: number) => {
  const n = Number(v ?? padrao);
  return Number.isFinite(n) ? Math.max(minimo, Math.floor(n)) : padrao;
};

/** Retenção LGPD: apaga auditoria antiga, minimiza perfis antigos e remove bloqueios vencidos. */
export async function aplicarRetencao(env: CronEnv) {
  const dia = 24 * 60 * 60 * 1000;
  const agora = Date.now();
  const corteAudit =
    agora - diasMinimo(env.AUDIT_LOG_RETENTION_DAYS, 365, 30) * dia;
  const cortePerfil =
    agora - diasMinimo(env.PROFILE_RETENTION_DAYS, 730, 90) * dia;
  const [audit, perfis, bloqueios] = await env.DB.batch([
    env.DB.prepare("delete from audit_logs where criado_em < ?1").bind(
      corteAudit,
    ),
    // mantém só o território (cidade, bairro, UF) e marca a minimização
    env.DB.prepare(
      `
      update manifestacoes set perfil = json_object(
        'cidade', json_extract(perfil, '$.cidade'),
        'bairro', json_extract(perfil, '$.bairro'),
        'uf', json_extract(perfil, '$.uf'),
        'retencaoPerfilAplicada', json('true'),
        'retencaoPerfilAplicadaEm', strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      where criado_em < ?1 and perfil is not null
        and coalesce(json_extract(perfil, '$.retencaoPerfilAplicada'), 0) <> 1`,
    ).bind(cortePerfil),
    env.DB.prepare(
      "delete from bloqueios where expira_em is not null and expira_em < ?1",
    ).bind(agora),
  ]);
  return {
    auditLogsApagados: audit.meta.changes,
    perfisMinimizados: perfis.meta.changes,
    bloqueiosVencidos: bloqueios.meta.changes,
  };
}

export async function executarCron(cron: string, env: CronEnv) {
  if (cron === "0 7 * * *") {
    const r = await aplicarRetencao(env);
    console.log("[cron] retenção LGPD", r);
  }
  await atualizarResumos(env.DB);
  console.log("[cron] resumos atualizados", cron);
}
