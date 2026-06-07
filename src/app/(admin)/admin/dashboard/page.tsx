'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { adminFetch, downloadAdminCsv } from '@/lib/adminClient';

interface RecentEvaluation {
  id: string;
  candidato: { nome: string };
  atributo: { nome: string };
  valor: number;
  criado_em: string;
}

interface TopCandidato {
  id: string;
  nome: string;
  cargo: string;
  cidade: string;
  total: number;
  liquidScore: number;
}

interface TopAtributo {
  id: string;
  nome: string;
  polaridade: number;
  total: number;
}

interface AtividadeDia {
  dia: string;
  total: number;
}

interface TopEntidade {
  id: string | null;
  nome: string;
  tipo: string;
  cidade: string;
  total: number;
  liquidScore: number;
}

interface StatsData {
  totalEvaluations: number;
  totalCandidatos: number;
  totalCampanhas: number;
  totalAtributos: number;
  totalOrgaos: number;
  totalServicos: number;
  avaliacoes24h: number;
  bloqueiosAtivos: number;
  topCandidatos: TopCandidato[];
  topOrgaos: TopEntidade[];
  topServicos: TopEntidade[];
  topAtributos: TopAtributo[];
  atividadeSemanal: AtividadeDia[];
}

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

function BarChart({ data }: { data: AtividadeDia[] }) {
  const max = Math.max(...data.map(d => d.total), 1);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return (
    <div className="flex items-end gap-2 h-24 w-full">
      {data.map((d, i) => {
        const pct = Math.max((d.total / max) * 100, d.total > 0 ? 8 : 2);
        const diaSemana = dias[new Date(d.dia + 'T12:00:00').getDay()];
        const isToday = d.dia === new Date().toISOString().slice(0, 10);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
            <span className="text-[8px] text-text-muted opacity-0 group-hover:opacity-60 transition-opacity font-mono">
              {d.total}
            </span>
            <div className="w-full flex items-end" style={{ height: '72px' }}>
              <div
                className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-primary/30 group-hover:bg-primary/50'}`}
                style={{ height: `${pct}%` }}
              />
            </div>
            <span className={`text-[7px] uppercase font-bold tracking-widest ${isToday ? 'text-primary' : 'text-text-muted opacity-40'}`}>
              {diaSemana}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LiquidBar({ score, total }: { score: number; total: number }) {
  if (total === 0) return <div className="h-1 w-full bg-white/5 rounded-full" />;
  const pctPos = Math.round(((score + total) / (2 * total)) * 100);
  return (
    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${pctPos >= 50 ? 'bg-positive' : 'bg-negative'}`}
        style={{ width: `${pctPos}%` }}
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [resRecent, resStats, resHealth] = await Promise.all([
        adminFetch('/api/admin/recent-evaluations').catch(() => null),
        adminFetch('/api/admin/stats').catch(() => null),
        fetch('/api/health').catch(() => null),
      ]);

      const dataRecent = resRecent?.ok ? await resRecent.json().catch(() => []) : [];
      const dataStats = resStats?.ok ? await resStats.json().catch(() => null) : null;
      const dataHealth = resHealth?.ok ? await resHealth.json().catch(() => null) : null;

      setRecentEvaluations(Array.isArray(dataRecent) ? dataRecent : []);
      setStats(dataStats);
      setHealth(dataHealth);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Falha ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/admin/login'); return; }

        await fetchData();

        const channel = supabase
          .channel('avaliacoes_realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avaliacoes' }, fetchData)
          .subscribe();

        return () => { supabase.removeChannel(channel); };
      } catch {
        setError('Erro na verificação de autenticação');
        setLoading(false);
      }
    };
    init();
  }, [router, fetchData]);

  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-primary font-display uppercase tracking-widest">
      <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="animate-pulse text-xs">Sincronizando Painel...</span>
    </div>
  );

  if (error) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
      <div className="text-4xl">⚠️</div>
      <h3 className="text-lg font-bold uppercase tracking-widest text-negative">Erro de Conexão</h3>
      <p className="text-xs text-text-muted opacity-60 uppercase tracking-widest">{error}</p>
      <button type="button" onClick={() => window.location.reload()}
        className="px-8 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all">
        Tentar Novamente
      </button>
    </div>
  );

  const healthChecks = [
    { label: 'Banco', status: health?.checks?.database || 'unknown', detail: `${health?.metrics?.databaseMs ?? '-'} ms` },
    { label: 'Campanhas', status: health?.checks?.activeCampaigns || 'unknown', detail: `${health?.metrics?.activeCampaigns ?? 0} ativas` },
    { label: 'Candidatos', status: health?.checks?.publicCandidates || 'unknown', detail: `${health?.metrics?.publicCandidates ?? 0}` },
    { label: 'CEPs MS', status: health?.checks?.cepsMs || 'unknown', detail: `${health?.metrics?.cepsMs ?? 0}` },
    { label: 'Rodadas', status: health?.checks?.rodadasAtivas || 'unknown', detail: `${health?.metrics?.activeRodadas ?? 0}` },
    { label: 'Tráfego 24h', status: health?.checks?.recentTraffic || 'unknown', detail: `${health?.metrics?.manifestacoes24h ?? 0} manif.` },
  ];

  const statusStyle = health?.status === 'ok'
    ? 'bg-positive/10 text-positive border-positive/20'
    : 'bg-negative/10 text-negative border-negative/20';

  const maxTopTotal = Math.max(...(stats?.topCandidatos?.map(c => c.total) ?? [1]), 1);

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Visão Geral</h2>
          <p className="text-[10px] text-text-muted uppercase mt-2 tracking-[0.2em]">Monitoramento em tempo real — MS 2026</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => downloadAdminCsv('/api/admin/export', 'avaliacoes_pulso_eleitoral_ms.csv')}
            className="bg-primary/10 border border-primary/20 rounded-2xl px-5 py-3 text-[9px] text-primary uppercase font-bold tracking-widest hover:bg-primary/20 transition-all"
          >
            Exportar CSV
          </button>
          <div className={`border rounded-2xl px-5 py-3 text-center ${statusStyle}`}>
            <p className="text-[7px] uppercase font-bold tracking-widest opacity-70">Saúde</p>
            <p className="text-sm font-bold mt-0.5">{health?.status?.toUpperCase() || '—'}</p>
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Avaliações', value: (stats?.totalEvaluations ?? 0).toLocaleString('pt-BR'), accent: true },
          { label: 'Nas últimas 24h', value: (stats?.avaliacoes24h ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Políticos Ativos', value: (stats?.totalCandidatos ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Órgãos Públicos', value: (stats?.totalOrgaos ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Serviços Públicos', value: (stats?.totalServicos ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Atributos Visíveis', value: (stats?.totalAtributos ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Campanhas', value: (stats?.totalCampanhas ?? 0).toLocaleString('pt-BR'), accent: false },
          { label: 'Bloqueios Ativos', value: (stats?.bloqueiosAtivos ?? 0).toLocaleString('pt-BR'), accent: false },
        ].map((kpi, i) => (
          <div key={i} className={`rounded-2xl p-4 border flex flex-col gap-1 ${kpi.accent ? 'bg-primary/10 border-primary/20' : 'bg-white/[0.02] border-white/5'}`}>
            <p className="text-[7px] uppercase font-bold tracking-widest text-text-muted opacity-60 leading-tight">{kpi.label}</p>
            <p className={`text-xl font-bold ${kpi.accent ? 'text-primary' : 'text-text'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Linha 2: Atividade semanal + Status operacional */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Gráfico de atividade */}
        <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest">Avaliações — Últimos 7 dias</h3>
            <span className="text-[8px] text-text-muted opacity-40 uppercase tracking-widest font-bold">
              Total: {stats?.atividadeSemanal?.reduce((s, d) => s + d.total, 0).toLocaleString('pt-BR') ?? 0}
            </span>
          </div>
          {stats?.atividadeSemanal ? (
            <BarChart data={stats.atividadeSemanal} />
          ) : (
            <div className="h-24 flex items-center justify-center text-[10px] text-text-muted opacity-30 uppercase tracking-widest">Sem dados</div>
          )}
        </div>

        {/* Status operacional */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5">Status Operacional</h3>
          <div className="flex flex-col gap-4">
            {healthChecks.map(sys => (
              <div key={sys.label} className="flex justify-between items-center border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <span className="text-[9px] uppercase font-bold text-text-muted tracking-widest opacity-60">{sys.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[8px] uppercase font-bold text-text-muted opacity-40 tracking-widest">{sys.detail}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${sys.status === 'ok' ? 'bg-positive shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-negative shadow-[0_0_10px_rgba(239,68,68,0.5)]'} animate-pulse`} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/5">
            <p className="text-[8px] text-text-muted opacity-50 leading-relaxed">
              24h: {(health?.metrics?.avaliacoes24h ?? 0).toLocaleString('pt-BR')} aval. · {(health?.metrics?.manifestacoes24h ?? 0).toLocaleString('pt-BR')} manif.<br/>
              CEPs baixa confiança: {health?.metrics?.cepsBaixaConfiancaPct ?? 0}% · Logs 7d: {health?.metrics?.auditLogs7d ?? 0}
            </p>
          </div>
        </div>
      </div>

      {/* Linha 3: Top candidatos + Top atributos + Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top 5 Políticos */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5">Top 5 Políticos</h3>
          <div className="flex flex-col gap-4">
            {(stats?.topCandidatos ?? []).length === 0 && (
              <p className="text-[9px] text-text-muted opacity-30 uppercase tracking-widest text-center py-8">Sem dados</p>
            )}
            {(stats?.topCandidatos ?? []).map((c, i) => (
              <div key={c.id} className="flex flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-[8px] font-bold text-primary opacity-60 mt-0.5 shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text truncate">{c.nome}</p>
                      <p className="text-[7px] text-text-muted opacity-50 uppercase tracking-widest truncate">{c.cargo} · {c.cidade}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold text-primary">{c.total.toLocaleString('pt-BR')}</p>
                    <p className={`text-[7px] font-bold ${c.liquidScore >= 0 ? 'text-positive' : 'text-negative'}`}>
                      {c.liquidScore >= 0 ? '+' : ''}{c.liquidScore}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 rounded-full" style={{ width: `${Math.round((c.total / maxTopTotal) * 100)}%` }} />
                  </div>
                  <LiquidBar score={c.liquidScore} total={c.total} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Atributos */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5">Top 5 Atributos</h3>
          <div className="flex flex-col gap-3">
            {(stats?.topAtributos ?? []).length === 0 && (
              <p className="text-[9px] text-text-muted opacity-30 uppercase tracking-widest text-center py-8">Sem dados</p>
            )}
            {(stats?.topAtributos ?? []).map((a, i) => {
              const maxA = Math.max(...(stats?.topAtributos?.map(x => x.total) ?? [1]), 1);
              return (
                <div key={a.id} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[8px] font-bold text-text-muted opacity-40 shrink-0">#{i + 1}</span>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-text truncate">{a.nome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[7px] font-bold uppercase ${a.polaridade === 1 ? 'text-positive' : 'text-negative'}`}>
                        {a.polaridade === 1 ? 'Virtude' : 'Negativo'}
                      </span>
                      <span className="text-[10px] font-bold text-primary">{a.total.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.polaridade === 1 ? 'bg-positive/50' : 'bg-negative/50'}`}
                      style={{ width: `${Math.round((a.total / maxA) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feed de interações */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[11px] font-bold uppercase tracking-widest">Últimas Interações</h3>
            <span className="px-2 py-1 bg-positive/10 text-positive text-[7px] font-bold uppercase rounded-full animate-pulse tracking-widest">Live</span>
          </div>
          <div className="flex flex-col gap-2">
            {recentEvaluations.map(ev => (
              <div key={ev.id} className="flex justify-between items-center p-3 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${ev.valor > 0 ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'}`}>
                    {ev.valor > 0 ? '+' : '−'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider truncate">{ev.candidato.nome}</p>
                    <p className="text-[7px] text-text-muted opacity-50 uppercase tracking-widest truncate">{ev.atributo.nome}</p>
                  </div>
                </div>
                <p className="text-[8px] text-text-muted font-mono opacity-30 shrink-0 ml-2">{new Date(ev.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
            {recentEvaluations.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-text-muted text-[9px] uppercase tracking-widest opacity-30">Aguardando sinal...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linha 4: Top Órgãos + Top Serviços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top 5 Órgãos Públicos */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5">Top 5 Órgãos Públicos</h3>
          <div className="flex flex-col gap-4">
            {(stats?.topOrgaos ?? []).length === 0 && (
              <p className="text-[9px] text-text-muted opacity-30 uppercase tracking-widest text-center py-8">Sem avaliações de órgãos ainda</p>
            )}
            {(stats?.topOrgaos ?? []).map((o, i) => {
              const maxO = Math.max(...(stats?.topOrgaos?.map(x => x.total) ?? [1]), 1);
              return (
                <div key={o.id ?? i} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-[8px] font-bold text-primary opacity-60 mt-0.5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text truncate">{o.nome}</p>
                        <p className="text-[7px] text-text-muted opacity-50 uppercase tracking-widest truncate">{o.tipo} · {o.cidade}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-primary">{o.total.toLocaleString('pt-BR')}</p>
                      <p className={`text-[7px] font-bold ${o.liquidScore >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {o.liquidScore >= 0 ? '+' : ''}{o.liquidScore}
                      </p>
                    </div>
                  </div>
                  <LiquidBar score={o.liquidScore} total={o.total} />
                  <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/30 rounded-full" style={{ width: `${Math.round((o.total / maxO) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Serviços Públicos */}
        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
          <h3 className="text-[11px] font-bold uppercase tracking-widest mb-5">Top 5 Serviços Públicos</h3>
          <div className="flex flex-col gap-4">
            {(stats?.topServicos ?? []).length === 0 && (
              <p className="text-[9px] text-text-muted opacity-30 uppercase tracking-widest text-center py-8">Sem avaliações de serviços ainda</p>
            )}
            {(stats?.topServicos ?? []).map((s, i) => {
              const maxS = Math.max(...(stats?.topServicos?.map(x => x.total) ?? [1]), 1);
              return (
                <div key={s.id ?? i} className="flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-[8px] font-bold text-primary opacity-60 mt-0.5 shrink-0">#{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text truncate">{s.nome}</p>
                        <p className="text-[7px] text-text-muted opacity-50 uppercase tracking-widest truncate">{s.tipo} · {s.cidade}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-primary">{s.total.toLocaleString('pt-BR')}</p>
                      <p className={`text-[7px] font-bold ${s.liquidScore >= 0 ? 'text-positive' : 'text-negative'}`}>
                        {s.liquidScore >= 0 ? '+' : ''}{s.liquidScore}
                      </p>
                    </div>
                  </div>
                  <LiquidBar score={s.liquidScore} total={s.total} />
                  <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary/30 rounded-full" style={{ width: `${Math.round((s.total / maxS) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
