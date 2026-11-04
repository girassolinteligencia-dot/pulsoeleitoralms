// Schema D1 (SQLite) do Pulso Eleitoral — equivalente ao antigo prisma/schema.prisma,
// com campos oficiais do TSE e tabelas de resumo para leitura rápida.
//
// Convenções SQLite:
//   - datas: INTEGER em epoch ms (mode "timestamp_ms")
//   - JSON: TEXT validado na aplicação (mode "json")
//   - boolean: INTEGER 0/1 (mode "boolean")
import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
const ts = (name: string) => integer(name, { mode: "timestamp_ms" });
const now = (name: string) =>
  ts(name)
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`);
const updatedAt = (name: string) => now(name).$onUpdateFn(() => new Date());
const bool = (name: string) => integer(name, { mode: "boolean" });
const json = <T = unknown>(name: string) =>
  text(name, { mode: "json" }).$type<T>();

// ---------------------------------------------------------------- campanhas
export const campanhas = sqliteTable("campanhas", {
  id: id(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("ativo"), // ativo | pausado | encerrado
  total_votos: integer("total_votos").notNull().default(0),
  media_consolidada: real("media_consolidada").notNull().default(0),
  last_calc_at: ts("last_calc_at"),
  meta_config: json<Record<string, unknown>>("meta_config"),
  data_inicio: now("data_inicio"),
  data_fim: ts("data_fim"),
});

export const atributos = sqliteTable(
  "atributos",
  {
    id: id(),
    nome: text("nome").notNull().unique(),
    descricao: text("descricao"),
    icone: text("icone"),
    polaridade: integer("polaridade").notNull().default(1), // 1 | -1
    visivel: bool("visivel").notNull().default(true),
    categoria: text("categoria").notNull().default("politico"), // politico | orgao | servico
  },
  (t) => [index("atributos_categoria_idx").on(t.categoria)],
);

export const campanhaAtributos = sqliteTable(
  "campanha_atributos",
  {
    id: id(),
    campanha_id: text("campanha_id")
      .notNull()
      .references(() => campanhas.id),
    atributo_id: text("atributo_id")
      .notNull()
      .references(() => atributos.id),
  },
  (t) => [
    index("campanha_atributos_campanha_idx").on(t.campanha_id),
    index("campanha_atributos_atributo_idx").on(t.atributo_id),
  ],
);

// --------------------------------------------------------------- candidatos
export const candidatos = sqliteTable(
  "candidatos",
  {
    id: id(),
    nome: text("nome").notNull(),
    partido: text("partido"),
    numero: text("numero"),
    cargo: text("cargo").notNull(),
    foto_url: text("foto_url"), // chave no R2 (ex.: candidatos/2024/120001596061.webp)
    ano_eleicao: integer("ano_eleicao").notNull().default(2024),
    cidade: text("cidade").notNull(),
    bairro: text("bairro"),
    status: text("status").notNull().default("Ativo"),
    status_verificacao: bool("status_verificacao").notNull().default(false),
    total_avaliacoes: integer("total_avaliacoes").notNull().default(0),
    campanha_id: text("campanha_id")
      .notNull()
      .references(() => campanhas.id),

    // Dados oficiais TSE (Etapa 4)
    sq_candidato: text("sq_candidato"),
    nome_urna: text("nome_urna"),
    cd_municipio_tse: text("cd_municipio_tse"),
    situacao_candidatura: text("situacao_candidatura"),
    situacao_totalizacao: text("situacao_totalizacao"), // ELEITO, SUPLENTE, NÃO ELEITO…
    fonte: text("fonte").notNull().default("manual"), // manual | tse_ckan | tse_divulgacand
    atualizado_tse_em: ts("atualizado_tse_em"),
  },
  (t) => [
    uniqueIndex("candidatos_ano_sq_uq").on(t.ano_eleicao, t.sq_candidato),
    index("candidatos_campanha_idx").on(t.campanha_id),
    index("candidatos_cidade_cargo_idx").on(t.cidade, t.cargo),
    index("candidatos_ano_cargo_idx").on(t.ano_eleicao, t.cargo),
    index("candidatos_nome_idx").on(t.nome),
  ],
);

// ------------------------------------------------- órgãos e serviços públicos
export const orgaosPublicos = sqliteTable(
  "orgaos_publicos",
  {
    id: id(),
    nome: text("nome").notNull(),
    tipo: text("tipo").notNull(),
    cidade: text("cidade").notNull(),
    uf: text("uf").notNull().default("MS"),
    descricao: text("descricao"),
    foto_url: text("foto_url"),
    campanha_id: text("campanha_id").references(() => campanhas.id),
    status: text("status").notNull().default("Ativo"),
    criado_em: now("criado_em"),
    atualizado_em: updatedAt("atualizado_em"),
  },
  (t) => [
    index("orgaos_cidade_idx").on(t.cidade),
    index("orgaos_tipo_idx").on(t.tipo),
    index("orgaos_status_idx").on(t.status),
  ],
);

export const servicosPublicos = sqliteTable(
  "servicos_publicos",
  {
    id: id(),
    nome: text("nome").notNull(),
    tipo: text("tipo").notNull(),
    cidade: text("cidade").notNull(),
    uf: text("uf").notNull().default("MS"),
    descricao: text("descricao"),
    foto_url: text("foto_url"),
    campanha_id: text("campanha_id").references(() => campanhas.id),
    status: text("status").notNull().default("Ativo"),
    criado_em: now("criado_em"),
    atualizado_em: updatedAt("atualizado_em"),
  },
  (t) => [
    index("servicos_cidade_idx").on(t.cidade),
    index("servicos_tipo_idx").on(t.tipo),
    index("servicos_status_idx").on(t.status),
  ],
);

// ------------------------------------------------ manifestações e avaliações
export const manifestacoes = sqliteTable(
  "manifestacoes",
  {
    id: id(),
    candidato_id: text("candidato_id").references(() => candidatos.id),
    orgao_id: text("orgao_id").references(() => orgaosPublicos.id),
    servico_id: text("servico_id").references(() => servicosPublicos.id),
    aprovacao: bool("aprovacao"),
    expectativa_vitoria: bool("expectativa_vitoria"),
    perfil: json<Record<string, unknown>>("perfil"),
    fingerprint_hash: text("fingerprint_hash").notNull(),
    ip_hash: text("ip_hash").notNull(),
    user_agent: text("user_agent"),
    duration_ms: integer("duration_ms"),
    is_valid: bool("is_valid").notNull().default(true),
    honeypot_triggered: bool("honeypot_triggered").notNull().default(false),
    criado_em: now("criado_em"),
  },
  (t) => [
    index("manifestacoes_candidato_idx").on(t.candidato_id),
    index("manifestacoes_orgao_idx").on(t.orgao_id),
    index("manifestacoes_servico_idx").on(t.servico_id),
    index("manifestacoes_fingerprint_idx").on(t.fingerprint_hash),
    index("manifestacoes_criado_idx").on(t.criado_em),
  ],
);

export const avaliacoes = sqliteTable(
  "avaliacoes",
  {
    id: id(),
    manifestacao_id: text("manifestacao_id").references(() => manifestacoes.id),
    candidato_id: text("candidato_id").references(() => candidatos.id),
    orgao_id: text("orgao_id").references(() => orgaosPublicos.id),
    servico_id: text("servico_id").references(() => servicosPublicos.id),
    atributo_id: text("atributo_id")
      .notNull()
      .references(() => atributos.id),
    valor: integer("valor").notNull(), // 1 | -1
    is_valid: bool("is_valid").notNull().default(true),
    fingerprint_hash: text("fingerprint_hash").notNull(),
    ip_hash: text("ip_hash").notNull(),
    user_agent: text("user_agent"),
    duration_ms: integer("duration_ms"),
    honeypot_triggered: bool("honeypot_triggered").notNull().default(false),
    device_info: json<Record<string, unknown>>("device_info"),
    geo_location: json<Record<string, unknown>>("geo_location"),
    criado_em: now("criado_em"),
  },
  (t) => [
    index("avaliacoes_candidato_idx").on(t.candidato_id),
    index("avaliacoes_orgao_idx").on(t.orgao_id),
    index("avaliacoes_servico_idx").on(t.servico_id),
    index("avaliacoes_manifestacao_idx").on(t.manifestacao_id),
    index("avaliacoes_atributo_idx").on(t.atributo_id),
    index("avaliacoes_criado_idx").on(t.criado_em),
  ],
);

// ----------------------------------------------------- operação e segurança
export const bloqueios = sqliteTable("bloqueios", {
  id: id(),
  hash: text("hash").notNull().unique(),
  motivo: text("motivo"),
  expira_em: ts("expira_em"),
  criado_em: now("criado_em"),
});

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: id(),
    acao: text("acao").notNull(),
    entidade: text("entidade").notNull(),
    entidade_id: text("entidade_id").notNull(),
    detalhes: json<Record<string, unknown>>("detalhes"),
    usuario_id: text("usuario_id"),
    criado_em: now("criado_em"),
  },
  (t) => [
    index("audit_logs_criado_idx").on(t.criado_em),
    index("audit_logs_acao_criado_idx").on(t.acao, t.criado_em),
    index("audit_logs_entidade_criado_idx").on(t.entidade, t.criado_em),
  ],
);

export const adminUsers = sqliteTable(
  "admin_users",
  {
    id: id(),
    email: text("email").notNull().unique(),
    nome: text("nome"),
    role: text("role").notNull().default("viewer"), // admin | editor | viewer
    ativo: bool("ativo").notNull().default(true),
    ultimo_login_em: ts("ultimo_login_em"),
    criado_em: now("criado_em"),
    atualizado_em: updatedAt("atualizado_em"),
  },
  (t) => [
    index("admin_users_ativo_idx").on(t.ativo),
    index("admin_users_role_idx").on(t.role),
  ],
);

export const parametrosPlataforma = sqliteTable("parametros_plataforma", {
  id: id(),
  chave: text("chave").notNull().unique(),
  valor: json("valor").notNull(),
  grupo: text("grupo").notNull().default("geral"),
  descricao: text("descricao"),
  updatedAt: updatedAt("updatedAt"),
});

export const cepsMs = sqliteTable(
  "ceps_ms",
  {
    cep: text("cep").primaryKey(),
    uf: text("uf").notNull().default("MS"),
    cidade: text("cidade").notNull(),
    bairro: text("bairro"),
    logradouro: text("logradouro"),
    origem: text("origem").notNull().default("brasilapi"),
    ibge_municipio_id: text("ibge_municipio_id"),
    localidades: json<unknown[]>("localidades"),
    bairro_confianca: real("bairro_confianca"),
    total_registros: integer("total_registros").notNull().default(0),
    localidades_count: integer("localidades_count").notNull().default(0),
    logradouros_count: integer("logradouros_count").notNull().default(0),
    latitude: real("latitude"),
    longitude: real("longitude"),
    importado_em: ts("importado_em"),
    criado_em: now("criado_em"),
    atualizado_em: updatedAt("atualizado_em"),
  },
  (t) => [
    index("ceps_cidade_idx").on(t.cidade),
    index("ceps_bairro_idx").on(t.bairro),
    index("ceps_origem_idx").on(t.origem),
    // busca por proximidade: faixa de lat/lng
    index("ceps_lat_lng_idx").on(t.latitude, t.longitude),
  ],
);

export const rodadasMetodologicas = sqliteTable(
  "rodadas_metodologicas",
  {
    id: id(),
    titulo: text("titulo").notNull(),
    tipo: text("tipo").notNull().default("percepcao_espontanea"),
    status: text("status").notNull().default("rascunho"),
    campanha_id: text("campanha_id").references(() => campanhas.id),
    objetivo: text("objetivo"),
    publico_alvo: text("publico_alvo"),
    abrangencia: text("abrangencia"),
    tamanho_amostra: integer("tamanho_amostra"),
    margem_erro: real("margem_erro"),
    nivel_confianca: real("nivel_confianca"),
    periodo_inicio: ts("periodo_inicio"),
    periodo_fim: ts("periodo_fim"),
    plano_amostral: json("plano_amostral"),
    ponderacao: json("ponderacao"),
    questionario: json("questionario"),
    observacoes: text("observacoes"),
    criado_em: now("criado_em"),
    atualizado_em: updatedAt("atualizado_em"),
  },
  (t) => [
    index("rodadas_campanha_idx").on(t.campanha_id),
    index("rodadas_tipo_status_idx").on(t.tipo, t.status),
  ],
);

// -------------------------------------------------- resumos (Cron Trigger)
// Alvo: entidade avaliada (candidato | orgao | servico) + id.
export const resumoAlvo = sqliteTable(
  "resumo_alvo",
  {
    alvo_tipo: text("alvo_tipo").notNull(),
    alvo_id: text("alvo_id").notNull(),
    total_manifestacoes: integer("total_manifestacoes").notNull().default(0),
    total_avaliacoes: integer("total_avaliacoes").notNull().default(0),
    aprovacoes: integer("aprovacoes").notNull().default(0),
    desaprovacoes: integer("desaprovacoes").notNull().default(0),
    expectativa_sim: integer("expectativa_sim").notNull().default(0),
    expectativa_nao: integer("expectativa_nao").notNull().default(0),
    saldo_atributos: integer("saldo_atributos").notNull().default(0),
    atualizado_em: now("atualizado_em"),
  },
  (t) => [primaryKey({ columns: [t.alvo_tipo, t.alvo_id] })],
);

export const resumoAtributo = sqliteTable(
  "resumo_atributo",
  {
    alvo_tipo: text("alvo_tipo").notNull(),
    alvo_id: text("alvo_id").notNull(),
    atributo_id: text("atributo_id").notNull(),
    positivos: integer("positivos").notNull().default(0),
    negativos: integer("negativos").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.alvo_tipo, t.alvo_id, t.atributo_id] })],
);

export const resumoDiario = sqliteTable(
  "resumo_diario",
  {
    dia: text("dia").notNull(), // YYYY-MM-DD (America/Campo_Grande)
    alvo_tipo: text("alvo_tipo").notNull(), // candidato | orgao | servico | total
    manifestacoes: integer("manifestacoes").notNull().default(0),
    avaliacoes: integer("avaliacoes").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.dia, t.alvo_tipo] })],
);

export const resumoTerritorio = sqliteTable(
  "resumo_territorio",
  {
    cidade: text("cidade").notNull(),
    bairro: text("bairro").notNull().default(""),
    alvo_tipo: text("alvo_tipo").notNull(),
    manifestacoes: integer("manifestacoes").notNull().default(0),
    aprovacoes: integer("aprovacoes").notNull().default(0),
    desaprovacoes: integer("desaprovacoes").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.cidade, t.bairro, t.alvo_tipo] })],
);
