'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';
import { GestaoAtributos } from '@/components/admin/GestaoAtributos';

// ─── tipos compartilhados ────────────────────────────────────────────────────

type Aba = 'saude' | 'auditoria' | 'tokens' | 'configuracoes' | 'seguranca' | 'atributos';

// ─── Aba: Saúde ──────────────────────────────────────────────────────────────

interface HealthData {
  status: 'ok' | 'degraded';
  checks?: Record<string, string>;
  metrics?: {
    activeCampaigns?: number;
    publicCandidates?: number;
    activeRodadas?: number;
    cepsMs?: number;
    cepsBaixaConfiancaPct?: number;
    manifestacoes24h?: number;
    avaliacoes24h?: number;
    auditLogs7d?: number;
    bloqueiosAtivos?: number;
    databaseMs?: number;
    responseMs?: number;
  };
}

function AbaSaude() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/health').catch(() => null);
    if (res?.ok) setHealth(await res.json().catch(() => null));
    setLoading(false);
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  const checks = [
    { label: 'Banco de dados', key: 'database', metrica: `${health?.metrics?.databaseMs ?? '–'} ms` },
    { label: 'Campanhas ativas', key: 'activeCampaigns', metrica: `${health?.metrics?.activeCampaigns ?? 0}` },
    { label: 'Candidatos públicos', key: 'publicCandidates', metrica: `${health?.metrics?.publicCandidates ?? 0}` },
    { label: 'CEPs MS carregados', key: 'cepsMs', metrica: `${health?.metrics?.cepsMs ?? 0}` },
    { label: 'Rodadas ativas', key: 'rodadasAtivas', metrica: `${health?.metrics?.activeRodadas ?? 0}` },
    { label: 'Tráfego 24h', key: 'recentTraffic', metrica: `${health?.metrics?.manifestacoes24h ?? 0} manif.` },
  ];

  const statusGlobal = health?.status;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className={`px-5 py-2.5 rounded-2xl border text-sm font-bold uppercase tracking-widest ${statusGlobal === 'ok' ? 'bg-positive/10 border-positive/20 text-positive' : statusGlobal === 'degraded' ? 'bg-negative/10 border-negative/20 text-negative' : 'bg-white/5 border-white/10 text-text-muted'}`}>
          {loading ? 'Verificando…' : statusGlobal?.toUpperCase() ?? 'Desconhecido'}
        </div>
        <button type="button" onClick={fetch_} className="text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-white transition-colors">
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map(c => {
          const st = health?.checks?.[c.key];
          return (
            <div key={c.key} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold tracking-widest text-text-muted opacity-60">{c.label}</p>
                <p className="text-base font-bold text-white mt-1">{c.metrica}</p>
              </div>
              <span className={`w-3 h-3 rounded-full shrink-0 ${st === 'ok' ? 'bg-positive shadow-[0_0_10px_rgba(34,197,94,0.5)]' : st ? 'bg-negative shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/20'} animate-pulse`} />
            </div>
          );
        })}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
        {[
          { label: 'Avaliações 24h', v: health?.metrics?.avaliacoes24h ?? 0 },
          { label: 'Manifestações 24h', v: health?.metrics?.manifestacoes24h ?? 0 },
          { label: 'CEPs baixa confiança', v: `${health?.metrics?.cepsBaixaConfiancaPct ?? 0}%` },
          { label: 'Logs de auditoria (7d)', v: health?.metrics?.auditLogs7d ?? 0 },
        ].map(item => (
          <div key={item.label}>
            <p className="text-[8px] uppercase font-bold tracking-widest text-text-muted opacity-50">{item.label}</p>
            <p className="text-xl font-bold text-white mt-1">{item.v}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
        <p className="text-[9px] uppercase font-bold tracking-widest text-text-muted mb-4">Checks brutos</p>
        {health?.checks ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(health.checks).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'ok' ? 'bg-positive' : 'bg-negative'}`} />
                <span className="text-[10px] font-mono text-text-muted">{k}: <span className={v === 'ok' ? 'text-positive' : 'text-negative'}>{v}</span></span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted opacity-40">Sem dados</p>
        )}
      </div>
    </div>
  );
}

// ─── Aba: Auditoria ───────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  acao: string;
  entidade: string;
  entidade_id: string;
  detalhes: unknown;
  usuario_id: string | null;
  criado_em: string;
}
interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  filters?: { acoes: string[]; entidades: string[] };
}

function AbaAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [search, setSearch] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [acoes, setAcoes] = useState<string[]>([]);
  const [entidades, setEntidades] = useState<string[]>([]);

  const query = useMemo(() => {
    const p = new URLSearchParams({ limit: '50', page: String(page) });
    if (acao) p.set('acao', acao);
    if (entidade) p.set('entidade', entidade);
    if (search) p.set('search', search);
    if (inicio) p.set('inicio', inicio);
    if (fim) p.set('fim', fim);
    return p.toString();
  }, [acao, entidade, fim, inicio, page, search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/audit-logs?${query}`);
      const json: AuditResponse = await res.json();
      setLogs(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setAcoes(json.filters?.acoes || []);
      setEntidades(json.filters?.entidades || []);
    } catch { setLogs([]); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const reset = () => { setAcao(''); setEntidade(''); setSearch(''); setInicio(''); setFim(''); setPage(1); };
  const upd = (set: (v: string) => void, v: string) => { set(v); setPage(1); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <p className="text-[10px] text-text-muted uppercase tracking-widest">{total} eventos encontrados</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <input type="text" value={search} onChange={e => upd(setSearch, e.target.value)}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-primary"
          placeholder="Buscar ação, entidade, ID ou usuário…" />
        <select value={acao} onChange={e => upd(setAcao, e.target.value)} title="Filtrar por ação"
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-primary">
          <option value="">Todas as ações</option>
          {acoes.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={entidade} onChange={e => upd(setEntidade, e.target.value)} title="Filtrar por entidade"
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-primary">
          <option value="">Todas as entidades</option>
          {entidades.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <input type="date" value={inicio} onChange={e => upd(setInicio, e.target.value)}
          title="Data início" aria-label="Data início"
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-primary" />
        <input type="date" value={fim} onChange={e => upd(setFim, e.target.value)}
          title="Data fim" aria-label="Data fim"
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none focus:border-primary" />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <p className="text-[10px] text-text-muted uppercase tracking-widest flex-1">Pág. {page} de {totalPages}</p>
        <button type="button" onClick={reset} className="border border-border text-text-muted px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">Limpar</button>
        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="border border-border text-text-muted px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white disabled:opacity-30 transition-all">←</button>
        <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="border border-border text-text-muted px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:text-white disabled:opacity-30 transition-all">→</button>
        <button type="button" onClick={fetchLogs} className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all">Atualizar</button>
      </div>

      <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-border text-[8px] text-text-muted uppercase font-bold tracking-widest">
          <span className="col-span-3">Data</span>
          <span className="col-span-2">Ação</span>
          <span className="col-span-2">Entidade</span>
          <span className="col-span-2">Usuário</span>
          <span className="col-span-3">Detalhes</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[10px]">Carregando…</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-text-muted uppercase tracking-widest text-[10px] opacity-40">Nenhum evento encontrado</div>
        ) : logs.map(log => (
          <div key={log.id} className="grid grid-cols-12 gap-3 px-5 py-4 border-b border-border/50 last:border-0 text-[11px] items-start hover:bg-white/[0.01] transition-colors">
            <div className="col-span-3">
              <p className="text-text font-bold">{new Date(log.criado_em).toLocaleDateString('pt-BR')}</p>
              <p className="text-text-muted mt-0.5 text-[9px]">{new Date(log.criado_em).toLocaleTimeString('pt-BR')}</p>
            </div>
            <p className="col-span-2 text-primary font-bold uppercase tracking-widest break-words text-[10px]">{log.acao}</p>
            <div className="col-span-2">
              <p className="text-text font-bold break-words">{log.entidade}</p>
              <p className="text-text-muted mt-0.5 break-all text-[9px]">{log.entidade_id}</p>
            </div>
            <p className="col-span-2 text-text-muted break-all text-[10px]">{log.usuario_id || 'N/A'}</p>
            <pre className="col-span-3 text-[9px] text-text-muted whitespace-pre-wrap break-words font-mono max-h-24 overflow-y-auto">
              {!log.detalhes ? 'Sem detalhes' : typeof log.detalhes === 'string' ? log.detalhes : JSON.stringify(log.detalhes, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba: API Tokens ──────────────────────────────────────────────────────────

interface TokenEntry { id: string; chave: string; descricao: string; token: string; ativo: boolean; criado_em: string; }

function AbaTokens() {
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [criando, setCriando] = useState(false);
  const [novoToken, setNovoToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const fetchTokens = useCallback(async () => {
    const res = await adminFetch('/api/admin/api-tokens');
    if (res.ok) setTokens(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchTokens(); }, [fetchTokens]);

  const criar = async () => {
    if (!descricao.trim()) return;
    setCriando(true);
    const res = await adminFetch('/api/admin/api-tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ descricao }) });
    if (res.ok) { const d = await res.json(); setNovoToken(d.token); setDescricao(''); await fetchTokens(); }
    setCriando(false);
  };

  const toggle = async (id: string, ativo: boolean) => {
    await adminFetch('/api/admin/api-tokens', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ativo: !ativo }) });
    await fetchTokens();
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir permanentemente?')) return;
    await adminFetch(`/api/admin/api-tokens?id=${id}`, { method: 'DELETE' });
    await fetchTokens();
  };

  const copiar = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="bg-surface-1 border border-border rounded-2xl p-5 space-y-3">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Endpoint</p>
        <code className="block text-xs text-primary bg-dark/60 rounded-xl px-4 py-3 break-all">GET /api/public/resultados</code>
        <div className="text-xs text-text-muted space-y-1">
          <p><span className="text-white">Auth:</span> header <code className="text-primary">x-api-token</code> ou <code className="text-primary">?token=</code></p>
          <p className="text-[10px]">Parâmetros: <code className="text-primary">categoria</code> · <code className="text-primary">dias</code> · <code className="text-primary">atributos</code> · <code className="text-primary">limite</code></p>
        </div>
      </div>

      {novoToken && (
        <div className="bg-positive/10 border border-positive/30 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-positive">Token gerado — copie agora, não será exibido novamente</p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-xs text-white bg-dark/60 rounded-xl px-4 py-3 break-all">{novoToken}</code>
            <button type="button" onClick={() => copiar(novoToken)} className="shrink-0 px-4 py-2 rounded-xl bg-positive/20 text-positive text-[10px] uppercase font-bold tracking-widest hover:bg-positive/30 transition-colors">
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <button type="button" onClick={() => setNovoToken(null)} className="text-[10px] text-text-muted hover:text-white transition-colors uppercase font-bold tracking-widest">Fechar</button>
        </div>
      )}

      <div className="bg-surface-1 border border-border rounded-2xl p-5 space-y-4">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Novo Token</p>
        <div className="flex gap-3">
          <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} onKeyDown={e => e.key === 'Enter' && criar()}
            placeholder="Descrição (ex: Site Institucional)"
            className="flex-1 bg-dark/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-colors" />
          <button type="button" onClick={criar} disabled={criando || !descricao.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-dark text-[10px] uppercase font-bold tracking-widest hover:bg-primary/80 disabled:opacity-40 transition-colors">
            {criando ? 'Gerando…' : 'Gerar'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Tokens ({tokens.length})</p>
        {loading && <p className="text-text-muted text-xs">Carregando…</p>}
        {!loading && tokens.length === 0 && <p className="text-text-muted text-xs opacity-40">Nenhum token criado ainda.</p>}
        {tokens.map(t => (
          <div key={t.id} className={`bg-surface-1 border rounded-2xl p-4 flex items-center gap-4 ${t.ativo ? 'border-border' : 'border-white/5 opacity-50'}`}>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${t.ativo ? 'bg-positive/20 text-positive' : 'bg-white/10 text-text-muted'}`}>{t.ativo ? 'Ativo' : 'Revogado'}</span>
                <span className="text-sm font-semibold text-white truncate">{t.descricao}</span>
              </div>
              <code className="text-[10px] text-text-muted">{t.token}</code>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" onClick={() => toggle(t.id, t.ativo)} className="px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest border border-white/10 text-text-muted hover:text-white transition-colors">
                {t.ativo ? 'Revogar' : 'Reativar'}
              </button>
              <button type="button" onClick={() => excluir(t.id)} className="px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest border border-negative/20 text-negative/60 hover:text-negative transition-colors">
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Aba: Configurações ───────────────────────────────────────────────────────

interface Parametro { id?: string; chave: string; valor: string | number | boolean | object; grupo: string; descricao: string | null; }
interface CampanhaOption { id: string; nome: string; status: string; public_scope?: { candidatos_visiveis: number }; }

function InputConfig({ chave, label, value, onUpdate }: { chave: string; label: string; value: string | number | boolean | object; onUpdate: (c: string, v: string | number | boolean | object) => void; }) {
  const [local, setLocal] = useState(String(value || ''));
  useEffect(() => { setLocal(String(value || '')); }, [value]);
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">{label}</label>
      <input type="text" value={local} onChange={e => setLocal(e.target.value)} onBlur={() => onUpdate(chave, local)}
        placeholder={`Configurar ${label}`}
        className="w-full bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-text focus:border-primary outline-none transition-all" />
    </div>
  );
}

function AbaConfiguracoes() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Partial<Parametro> | null>(null);

  const fetchP = useCallback(async () => {
    const res = await adminFetch('/api/admin/configuracoes');
    setParametros(await res.json());
    setLoading(false);
  }, []);

  const fetchC = useCallback(async () => {
    const res = await adminFetch('/api/admin/campanhas?limit=100');
    const d = await res.json();
    setCampanhas(d.data || []);
  }, []);

  useEffect(() => { Promise.all([fetchP(), fetchC()]); }, [fetchP, fetchC]);

  const update = async (chave: string, valor: string | number | boolean | object, grupo = 'geral', descricao: string | null = null) => {
    await adminFetch('/api/admin/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chave, valor, grupo, descricao }) });
    await fetchP();
    if (chave.startsWith('public_')) await fetchC();
  };

  const salvar = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editando?.chave) return;
    let v = editando.valor;
    try { if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) v = JSON.parse(v); } catch { /* keep as string */ }
    await adminFetch('/api/admin/configuracoes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...editando, valor: v }) });
    setEditando(null);
    fetchP();
  };

  const get = (chave: string) => parametros.find(p => p.chave === chave)?.valor;
  const getArr = <T,>(chave: string, cast: (x: unknown) => T): T[] => { const v = get(chave); return Array.isArray(v) ? v.map(cast).filter(Boolean) as T[] : []; };
  const publicYears = getArr<number>('public_anos_ativos', Number);
  const publicCampaigns = getArr<string>('public_campanhas_ativas', String);
  const scopeMode = String(get('public_scope_mode') || 'all_active');
  const pub = (chave: string, valor: string | number | boolean | object, desc: string) => update(chave, valor, 'publico', desc);

  if (loading) return <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[10px]">Carregando…</div>;

  return (
    <div className="flex flex-col gap-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-surface-1 border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3"><span>📝</span><h3 className="text-xs font-bold uppercase tracking-widest">Rótulos das Etapas</h3></div>
          <InputConfig chave="onboarding_etapa1_titulo" label="Título Etapa 1 (ID)" value={get('onboarding_etapa1_titulo') || ''} onUpdate={update} />
          <InputConfig chave="onboarding_etapa2_titulo" label="Título Etapa 2 (Perfil)" value={get('onboarding_etapa2_titulo') || ''} onUpdate={update} />
        </section>

        <section className="bg-surface-1 border border-border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3"><span>📅</span><h3 className="text-xs font-bold uppercase tracking-widest">Escopo Público</h3></div>
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Modo de Campanhas</label>
            <div className="flex gap-3">
              {[['all_active', 'Todas ativas'], ['selected_campaigns', 'Selecionadas']].map(([val, lbl]) => (
                <button key={val} type="button" onClick={() => pub('public_scope_mode', val, 'Modo de escopo público.')}
                  className={`flex-1 px-3 py-2.5 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${scopeMode === val ? 'bg-primary border-primary text-white' : 'bg-dark border-border text-text-muted hover:text-white'}`}>
                  {lbl}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest block mb-2">Anos públicos {publicYears.length === 0 ? '(todos)' : ''}</label>
            <div className="flex flex-wrap gap-2">
              {[2018, 2020, 2022, 2024, 2026].map(ano => (
                <button key={ano} type="button" onClick={() => pub('public_anos_ativos', publicYears.includes(ano) ? publicYears.filter(a => a !== ano) : [...publicYears, ano].sort((a, b) => a - b), 'Anos eleitorais públicos.')}
                  className={`px-5 py-2.5 rounded-xl border text-[10px] font-bold transition-all ${publicYears.includes(ano) ? 'bg-primary border-primary text-white' : 'bg-dark border-border text-text-muted hover:text-white'}`}>
                  {ano}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest block mb-2">Campanhas selecionadas</label>
            <div className="max-h-40 overflow-y-auto flex flex-col gap-2 pr-1">
              {campanhas.map(c => (
                <button key={c.id} type="button" onClick={() => pub('public_campanhas_ativas', publicCampaigns.includes(c.id) ? publicCampaigns.filter(x => x !== c.id) : [...publicCampaigns, c.id], 'Campanhas habilitadas no escopo selecionado.')}
                  className={`w-full text-left p-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${publicCampaigns.includes(c.id) ? 'bg-primary/10 border-primary text-white' : 'bg-dark border-border text-text-muted hover:text-white'}`}>
                  {c.nome} <span className="opacity-50 normal-case font-normal">· {c.status}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-surface-1 border border-border rounded-2xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center gap-3"><span>👤</span><h3 className="text-xs font-bold uppercase tracking-widest">Campos de Perfil Ativos</h3></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {['sexo', 'cor', 'escolaridade', 'estadoCivil', 'faixaSalarial', 'religiao', 'ocupacao', 'filhos', 'orientacaoSexual', 'deficiencia', 'tempoResidencia'].map(campo => {
              const config = (get('onboarding_campos') as Record<string, boolean>) || {};
              const ativo = config[campo] !== false;
              return (
                <button type="button" key={campo} onClick={() => update('onboarding_campos', { ...config, [campo]: !ativo })}
                  className={`flex flex-col gap-3 p-4 rounded-2xl border text-left transition-all ${ativo ? 'bg-primary/10 border-primary/60' : 'bg-dark border-border opacity-50 hover:opacity-70'}`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text">{campo.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full ${ativo ? 'bg-positive/20 text-positive' : 'bg-white/5 text-text-muted'}`}>{ativo ? 'Ativo' : 'Inativo'}</span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors shrink-0 ${ativo ? 'bg-primary' : 'bg-surface-2'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all duration-200 ${ativo ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-surface-1 border border-border rounded-2xl p-6 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3"><span>⚙️</span><h3 className="text-xs font-bold uppercase tracking-widest">Parâmetros Avançados (JSON)</h3></div>
            <button type="button" onClick={() => setEditando({ chave: '', valor: '', grupo: 'geral', descricao: '' })}
              className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all">
              + Novo
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-[9px] uppercase font-bold text-text-muted tracking-widest">Chave</th>
                  <th className="px-4 py-3 text-[9px] uppercase font-bold text-text-muted tracking-widest">Valor</th>
                  <th className="px-4 py-3 text-[9px] uppercase font-bold text-text-muted tracking-widest" scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {parametros.map(p => (
                  <tr key={p.chave} className="border-b border-border/30 hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3 text-[10px] font-bold text-text">{p.chave}</td>
                    <td className="px-4 py-3 text-[10px] font-mono text-primary max-w-[300px] truncate">{typeof p.valor === 'object' ? JSON.stringify(p.valor) : String(p.valor)}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" onClick={() => setEditando({ ...p, valor: typeof p.valor === 'object' ? JSON.stringify(p.valor) : p.valor })}
                        className="text-[9px] font-bold text-text-muted hover:text-white uppercase tracking-widest">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editando && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => setEditando(null)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-1 border border-border rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-lg font-bold font-display uppercase tracking-widest mb-6">Editar Parâmetro</h2>
            <form onSubmit={salvar} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Chave</label>
                <input type="text" value={editando.chave || ''} onChange={e => setEditando({ ...editando, chave: e.target.value })}
                  placeholder="Ex: geral_ano_pleito" aria-label="Chave do parâmetro"
                  className="w-full bg-dark border border-border rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Valor</label>
                <textarea value={String(editando.valor || '')} onChange={e => setEditando({ ...editando, valor: e.target.value })}
                  placeholder="Insira o valor ou JSON aqui" aria-label="Valor do parâmetro"
                  className="w-full bg-dark border border-border rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary h-28 resize-none font-mono" required />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" className="flex-1 bg-primary text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest">Salvar</button>
                <button type="button" onClick={() => setEditando(null)} className="px-5 py-3 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Aba: Segurança ───────────────────────────────────────────────────────────

interface Bloqueio { id: string; hash: string; motivo: string; criado_em: string; }

function AbaSeguranca() {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/bloqueios').then(r => r.json()).then(d => { setBloqueios(d); setLoading(false); });
  }, []);

  const desbloquear = async (id: string) => {
    const res = await adminFetch('/api/admin/bloqueios', { method: 'DELETE', body: JSON.stringify({ id }) });
    if (res.ok) setBloqueios(b => b.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-6">
      <p className="text-[10px] text-text-muted uppercase tracking-widest">{bloqueios.length} hashes bloqueados</p>

      {/* Desktop */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Hash</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Motivo</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Criado em</th>
              <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody>
            {bloqueios.map(b => (
              <tr key={b.id} className="border-b border-border/30 hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4 text-[10px] font-mono text-primary truncate max-w-[200px]">{b.hash}</td>
                <td className="px-6 py-4 text-[10px] text-text-muted uppercase">{b.motivo || 'Atividade suspeita'}</td>
                <td className="px-6 py-4 text-[10px] text-text-muted">{new Date(b.criado_em).toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4 text-right">
                  <button type="button" onClick={() => desbloquear(b.id)} className="text-[9px] uppercase font-bold text-negative hover:brightness-125 transition-all">Desbloquear</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && bloqueios.length === 0 && (
          <div className="py-16 text-center text-text-muted text-[10px] uppercase tracking-widest opacity-40">Nenhum bloqueio ativo</div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col gap-3">
        {bloqueios.map(b => (
          <div key={b.id} className="bg-surface-1 border border-border rounded-2xl p-5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-mono text-primary truncate flex-1">{b.hash}</p>
              <span className="bg-negative/10 text-negative text-[7px] font-bold px-2 py-1 rounded-full uppercase tracking-widest shrink-0 ml-2">Bloqueado</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-border/50">
              <span className="text-[9px] text-text-muted uppercase">{b.motivo || 'Atividade suspeita'}</span>
              <button type="button" onClick={() => desbloquear(b.id)} className="text-[9px] uppercase font-bold text-negative">Desbloquear</button>
            </div>
          </div>
        ))}
        {!loading && bloqueios.length === 0 && (
          <div className="py-16 text-center text-text-muted uppercase tracking-widest text-[9px] opacity-40">Zero ameaças detectadas</div>
        )}
        {loading && <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">Escaneando base…</div>}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const ABAS: { id: Aba; label: string; icon: string }[] = [
  { id: 'saude', label: 'Saúde', icon: '💚' },
  { id: 'auditoria', label: 'Auditoria', icon: '🧾' },
  { id: 'tokens', label: 'API Tokens', icon: '🔑' },
  { id: 'configuracoes', label: 'Configurações', icon: '⚙️' },
  { id: 'seguranca', label: 'Segurança', icon: '🛡️' },
  { id: 'atributos', label: 'Atributos', icon: '🏷️' },
];

export default function SistemaPage() {
  const [aba, setAba] = useState<Aba>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('aba');
      if (p && ['saude', 'auditoria', 'tokens', 'configuracoes', 'seguranca', 'atributos'].includes(p)) return p as Aba;
    }
    return 'saude';
  });

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Sistema</h2>
        <p className="text-[10px] text-text-muted uppercase mt-2 tracking-[0.2em]">Saúde, auditoria, tokens de API, configurações e segurança</p>
      </header>

      {/* Tabs */}
      <nav className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {ABAS.map(a => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${aba === a.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <span>{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </nav>

      {/* Conteúdo */}
      <div>
        {aba === 'saude' && <AbaSaude />}
        {aba === 'auditoria' && <AbaAuditoria />}
        {aba === 'tokens' && <AbaTokens />}
        {aba === 'configuracoes' && <AbaConfiguracoes />}
        {aba === 'seguranca' && <AbaSeguranca />}
        {aba === 'atributos' && <GestaoAtributos />}
      </div>
    </div>
  );
}
