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

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const [stats, setStats] = useState({ totalEvaluations: 0 });
  const [health, setHealth] = useState<HealthData | null>(null);
  const router = useRouter();

  const fetchRecent = useCallback(async () => {
    try {
      setError(null);
      const [resRecent, resStats, resHealth] = await Promise.all([
        adminFetch('/api/admin/recent-evaluations').catch(() => ({ json: () => [], ok: false })),
        adminFetch('/api/admin/stats').catch(() => ({ json: () => ({ totalEvaluations: 0 }), ok: false })),
        fetch('/api/health').catch(() => ({ json: () => null, ok: false })),
      ]);
      
      if (!resRecent.ok || !resStats.ok || !resHealth.ok) {
        console.warn('Algumas APIs do dashboard falharam');
      }

      const dataRecent = await (resRecent as Response).json().catch(() => []);
      const dataStats = await (resStats as Response).json().catch(() => ({ totalEvaluations: 0 }));
      const dataHealth = await (resHealth as Response).json().catch(() => null) as HealthData | null;

      setRecentEvaluations(Array.isArray(dataRecent) ? dataRecent : []);
      setStats(dataStats || { totalEvaluations: 0 });
      setHealth(dataHealth);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !currentSession) {
          router.push('/admin/login');
          return;
        } else {
          await fetchRecent();
          
          const channel = supabase
            .channel('avaliacoes_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avaliacoes' }, () => {
              fetchRecent();
            })
            .subscribe();

          return () => {
            supabase.removeChannel(channel);
          };
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setError('Erro na verificação de autenticação');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, fetchRecent]);

  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-primary font-display uppercase tracking-widest">
      <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      <span className="animate-pulse">Sincronizando Painel...</span>
    </div>
  );

  if (error) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
      <div className="text-4xl">⚠️</div>
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-bold uppercase tracking-widest text-negative">Erro de Conexão</h3>
        <p className="text-xs text-text-muted opacity-60 uppercase tracking-widest">{error}</p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="px-8 py-4 bg-primary/10 border border-primary/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
      >
        Tentar Novamente
      </button>
    </div>
  );

  const healthChecks = [
    { label: 'Banco', status: health?.checks?.database || 'unknown', detail: `${health?.metrics?.databaseMs ?? '-'} ms` },
    { label: 'Campanhas', status: health?.checks?.activeCampaigns || 'unknown', detail: `${health?.metrics?.activeCampaigns ?? 0} ativas` },
    { label: 'Candidatos públicos', status: health?.checks?.publicCandidates || 'unknown', detail: `${health?.metrics?.publicCandidates ?? 0}` },
    { label: 'CEPs MS', status: health?.checks?.cepsMs || 'unknown', detail: `${health?.metrics?.cepsMs ?? 0}` },
    { label: 'Rodadas ativas', status: health?.checks?.rodadasAtivas || 'unknown', detail: `${health?.metrics?.activeRodadas ?? 0}` },
    { label: 'Tráfego 24h', status: health?.checks?.recentTraffic || 'unknown', detail: `${health?.metrics?.manifestacoes24h ?? 0} manifestações` },
  ];

  const statusStyle = health?.status === 'ok'
    ? 'bg-positive/10 text-positive border-positive/20'
    : 'bg-negative/10 text-negative border-negative/20';

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Visão Geral</h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-[0.2em]">Monitoramento de pulso em tempo real</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <button
            onClick={() => downloadAdminCsv('/api/admin/export', 'avaliacoes_pulso_eleitoral_ms.csv')}
            className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 md:px-8 md:py-5 text-center hover:bg-primary/20 transition-all group flex-1 md:flex-none"
          >
            <p className="text-[9px] md:text-[10px] text-primary uppercase font-bold tracking-widest">Baixar Auditoria</p>
          </button>
          <div className="bg-surface-1 border border-border rounded-2xl px-6 py-4 md:px-8 md:py-5 text-center min-w-[140px] flex-1 md:flex-none">
            <p className="text-[8px] md:text-[9px] text-text-muted uppercase font-bold tracking-widest">Total Avaliações</p>
            <p className="text-xl md:text-2xl font-bold text-primary mt-1 md:mt-2">{stats.totalEvaluations.toLocaleString('pt-BR')}</p>
          </div>
          <div className={`border rounded-2xl px-6 py-4 md:px-8 md:py-5 text-center min-w-[140px] flex-1 md:flex-none ${statusStyle}`}>
            <p className="text-[8px] md:text-[9px] uppercase font-bold tracking-widest">Saúde</p>
            <p className="text-xl md:text-2xl font-bold mt-1 md:mt-2">{health?.status || '...'}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest">Últimas Interações</h3>
              <span className="px-3 py-1 bg-positive/10 text-positive text-[8px] font-bold uppercase rounded-full animate-pulse tracking-widest">Atividade Live</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {recentEvaluations.map(ev => (
                <div key={ev.id} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover:scale-110 transition-transform">
                        {ev.valor > 0 ? '+' : ''}
                     </div>
                     <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">{ev.candidato.nome}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1 opacity-60">{ev.atributo.nome}</p>
                     </div>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono opacity-40">{new Date(ev.criado_em).toLocaleTimeString()}</p>
                </div>
              ))}
              {recentEvaluations.length === 0 && (
                 <div className="py-24 text-center">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest opacity-30 italic">Aguardando sinal das urnas digitais...</p>
                 </div>
              )}
            </div>
         </div>

         <div className="flex flex-col gap-8">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-10">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest mb-8">Status Operacional</h3>
              <div className="flex flex-col gap-8">
                {healthChecks.map(sys => (
                  <div key={sys.label} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest opacity-60">{sys.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[8px] uppercase font-bold text-text-muted opacity-40 tracking-widest">{sys.detail}</span>
                      <span className={`w-2 h-2 rounded-full ${
                        sys.status === 'ok' ? 'bg-positive shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-negative shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                      } animate-pulse`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-all" />
               <h3 className="text-xs font-bold uppercase tracking-widest mb-4 relative z-10">Observabilidade</h3>
               <p className="text-[11px] text-text-muted leading-relaxed opacity-80 relative z-10">
                 Últimas 24h: {(health?.metrics?.avaliacoes24h ?? 0).toLocaleString('pt-BR')} avaliações, {(health?.metrics?.manifestacoes24h ?? 0).toLocaleString('pt-BR')} manifestações. CEPs de baixa confiança: {health?.metrics?.cepsBaixaConfiancaPct ?? 0}%.
               </p>
               <p className="text-[9px] text-text-muted uppercase tracking-widest mt-5 relative z-10">
                 Logs 7d: {health?.metrics?.auditLogs7d ?? 0} • Bloqueios ativos: {health?.metrics?.bloqueiosAtivos ?? 0}
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
