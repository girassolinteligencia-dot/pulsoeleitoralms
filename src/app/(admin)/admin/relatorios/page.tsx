'use client';

import React, { useEffect, useState } from 'react';
import { RankingBarChart } from '@/components/admin/charts/RankingBarChart';
import { CargoGroupedChart } from '@/components/admin/charts/CargoGroupedChart';
import { TemaDonutChart } from '@/components/admin/charts/TemaDonutChart';
import { TrendAreaChart } from '@/components/admin/charts/TrendAreaChart';
import { PolarizationScatterChart } from '@/components/admin/charts/PolarizationScatterChart';
import { AprovacaoChart } from '@/components/admin/charts/AprovacaoChart';
import { DemographicRadarChart } from '@/components/admin/charts/DemographicRadarChart';
import { BairroTreeMap } from '@/components/admin/charts/BairroTreeMap';
import { TopAtributosChart } from '@/components/admin/charts/TopAtributosChart';
import { motion, AnimatePresence } from 'framer-motion';
import { User, MapPin, ThumbsUp, TrendingUp, AlertCircle, PieChart as PieIcon, Download } from 'lucide-react';
import { adminFetch, downloadAdminCsv } from '@/lib/adminClient';

interface RodadaOption {
  id: string;
  titulo: string;
  tipo: 'percepcao_espontanea' | 'pesquisa_registravel';
  status: string;
  campanha?: {
    nome: string;
  } | null;
}

interface AtributoCandidato {
  nome: string;
  count: number;
  polaridade: number;
}

interface CandidatoAtributos {
  candidatoId: string;
  nome: string;
  cargo: string;
  totalVozes: number;
  liquidScore: number;
  atributos: AtributoCandidato[];
}

interface ReportData {
  totalVotos: number;
  totalAvaliacoes?: number;
  aprovacao: { sim: number; nao: number; total: number; expectativa: number };
  cidades?: { name: string; value: number }[];
  bairros: { name: string; value: number }[];
  ranking: { nome: string; liquidScore: number; total: number }[];
  tendencia: { dia: string; score: number }[];
  cargoSentimento: { cargo: string; apoio: number; neutro: number; rejeicao: number }[];
  temas: { name: string; value: number }[];
  polarizacao: { x: number; y: number; z: number; nome: string }[];
  demografia: { categoria: string; dados: { label: string; value: number }[] }[];
  topAtributos: { virtudes: { nome: string; count: number }[]; defeitos: { nome: string; count: number }[] };
  atributosPorCandidato: CandidatoAtributos[];
  territorio?: {
    qualidade: {
      total: number;
      comCidade: number;
      comBairro: number;
      comConfianca: number;
      baixaConfianca: number;
      cidadePct: number;
      bairroPct: number;
      confiancaPct: number;
      baixaConfiancaPct: number;
    };
    cidades: {
      name: string;
      value: number;
      aprovacaoPct: number;
      expectativaPct: number;
      topCandidato: string;
      topCandidatoVozes: number;
    }[];
    bairros: {
      name: string;
      value: number;
      aprovacaoPct: number;
      expectativaPct: number;
      topCandidato: string;
      topCandidatoVozes: number;
    }[];
    candidatoPorCidade: {
      cidade: string;
      candidato: string;
      manifestacoes: number;
      aprovacaoPct: number;
      expectativaPct: number;
    }[];
  };
  metodologia?: {
    rodada: RodadaOption | null;
    periodo: {
      inicio: string;
      fim: string | null;
    };
    aviso: string;
  };
}

type CategoriaFiltro = 'todos' | 'politico' | 'orgao_publico' | 'servico_publico';

const CATEGORIA_LABELS: Record<CategoriaFiltro, string> = {
  todos: 'Todos',
  politico: 'Políticos',
  orgao_publico: 'Órgãos',
  servico_publico: 'Serviços',
};

export default function AdminRelatoriosPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [rodadas, setRodadas] = useState<RodadaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dias, setDias] = useState(30);
  const [rodadaId, setRodadaId] = useState('');
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todos');
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const toggleAberto = (id: string) =>
    setAbertos(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (rodadaId) params.set('rodadaId', rodadaId);
        else params.set('dias', String(dias));
        if (categoria !== 'todos') params.set('categoria', categoria);

        const res = await adminFetch(`/api/admin/relatorios?${params.toString()}`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error('Erro ao carregar relatórios:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dias, rodadaId, categoria]);

  useEffect(() => {
    const fetchRodadas = async () => {
      try {
        const res = await adminFetch('/api/admin/rodadas?limit=100');
        const json = await res.json();
        setRodadas(json.data || []);
      } catch (error) {
        console.error('Erro ao carregar rodadas metodológicas:', error);
      }
    };

    fetchRodadas();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (rodadaId) params.set('rodadaId', rodadaId);
      else params.set('dias', String(dias));

      const suffix = rodadaId ? `rodada_${rodadaId}` : `ultimos_${dias}_dias`;
      await downloadAdminCsv(`/api/admin/export?${params.toString()}`, `pulso_eleitoral_ms_${suffix}.csv`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      alert(error instanceof Error ? error.message : 'Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4 text-primary font-display uppercase tracking-widest animate-pulse">
      Processando Inteligência Analítica...
    </div>
  );

  if (!data) return <div>Erro ao carregar dados.</div>;

  return (
    <div className="flex flex-col gap-12 md:gap-16 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Hub de Inteligência</h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-[0.2em]">Cruzamento de variáveis e tendências</p>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full md:w-auto">
          <select
            aria-label="Rodada metodológica"
            value={rodadaId}
            onChange={(event) => setRodadaId(event.target.value)}
            className="bg-[#1c1814] border border-white/10 rounded-2xl px-4 py-3 text-[10px] text-white uppercase font-bold tracking-widest outline-none focus:border-primary min-w-64"
          >
            <option value="">Sem rodada: período móvel</option>
            {rodadas.map((rodada) => (
              <option key={rodada.id} value={rodada.id}>
                {rodada.titulo} {rodada.campanha?.nome ? `- ${rodada.campanha.nome}` : ''}
              </option>
            ))}
          </select>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {(Object.keys(CATEGORIA_LABELS) as CategoriaFiltro[]).map(cat => (
              <button
                type="button"
                key={cat}
                onClick={() => setCategoria(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${categoria === cat ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                {CATEGORIA_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
            {[7, 30, 90].map(d => (
              <button
                type="button"
                key={d}
                disabled={Boolean(rodadaId)}
                onClick={() => setDias(d)}
                className={`px-5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-30 ${dias === d && !rodadaId ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-white'}`}
              >
                {d} Dias
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
          >
            <Download size={14} />
            {exporting ? 'Exportando' : 'CSV'}
          </button>
        </div>
      </header>

      {data.metodologia && (
        <section className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <p className="text-[9px] text-primary uppercase font-bold tracking-widest mb-3">
              Escopo Metodológico
            </p>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text">
              {data.metodologia.rodada?.titulo || `Período móvel de ${dias} dias`}
            </h3>
            <p className="text-[11px] text-text-muted leading-relaxed mt-3 max-w-3xl">
              {data.metodologia.aviso}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[9px] text-text-muted uppercase tracking-widest">Período</p>
            <p className="text-xs font-bold text-text mt-2">
              {new Date(data.metodologia.periodo.inicio).toLocaleDateString('pt-BR')}
              {' até '}
              {data.metodologia.periodo.fim ? new Date(data.metodologia.periodo.fim).toLocaleDateString('pt-BR') : 'agora'}
            </p>
            {data.metodologia.rodada && (
              <p className="text-[9px] text-text-muted uppercase tracking-widest mt-3">
                {data.metodologia.rodada.tipo === 'pesquisa_registravel' ? 'Pesquisa registrável' : 'Percepção espontânea'}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Sumário de KPIs Rápidos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Manifestações', value: data.totalVotos, icon: User, color: 'text-primary' },
          { label: 'Aprovação Média', value: `${Math.round((data.aprovacao.sim / data.aprovacao.total) * 100) || 0}%`, icon: ThumbsUp, color: 'text-[#A8C47A]' },
          { label: 'Expectativa de Vitória', value: `${Math.round((data.aprovacao.expectativa / data.aprovacao.total) * 100) || 0}%`, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Bairros Ativos', value: data.bairros.length, icon: MapPin, color: 'text-orange-400' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 flex items-center gap-5"
          >
            <div className={`p-3 rounded-2xl bg-white/5 ${kpi.color}`}>
              <kpi.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] text-text-muted uppercase tracking-widest mb-1">{kpi.label}</p>
              <p className="text-xl font-bold font-display">{kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {data.territorio && (
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-orange-400"><MapPin size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Leitura Territorial do Respondente</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">
                Cidade e bairro declarados pelo cidadão, não pelo candidato
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'Com cidade', value: `${data.territorio.qualidade.cidadePct}%`, hint: data.territorio.qualidade.comCidade },
              { label: 'Com bairro', value: `${data.territorio.qualidade.bairroPct}%`, hint: data.territorio.qualidade.comBairro },
              { label: 'Com confiança CEP', value: `${data.territorio.qualidade.confiancaPct}%`, hint: data.territorio.qualidade.comConfianca },
              { label: 'Baixa confiança', value: `${data.territorio.qualidade.baixaConfiancaPct}%`, hint: data.territorio.qualidade.baixaConfianca },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5">
                <p className="text-[9px] text-text-muted uppercase tracking-widest">{item.label}</p>
                <p className="text-2xl font-bold text-text mt-2">{item.value}</p>
                <p className="text-[9px] text-text-muted mt-1">{item.hint.toLocaleString('pt-BR')} manifestações</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-5">Cidades das vozes</h4>
              <div className="flex flex-col gap-3">
                {data.territorio.cidades.slice(0, 8).map((item) => (
                  <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/5 pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-text truncate">{item.name}</p>
                      <p className="text-[9px] text-text-muted mt-1 truncate">
                        Mais avaliado: {item.topCandidato || '-'} ({item.topCandidatoVozes} vozes)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{item.value}</p>
                      <p className="text-[9px] text-text-muted">Aprovação {item.aprovacaoPct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 overflow-hidden">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-5">Bairros das vozes</h4>
              <div className="flex flex-col gap-3">
                {data.territorio.bairros.slice(0, 8).map((item) => (
                  <div key={item.name} className="grid grid-cols-[1fr_auto] gap-4 border-b border-white/5 pb-3 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-text truncate">{item.name}</p>
                      <p className="text-[9px] text-text-muted mt-1 truncate">
                        Mais avaliado: {item.topCandidato || '-'} ({item.topCandidatoVozes} vozes)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{item.value}</p>
                      <p className="text-[9px] text-text-muted">Expectativa {item.expectativaPct}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 overflow-x-auto">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-text mb-5">Entidade × cidade do respondente</h4>
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-3 text-[9px] uppercase tracking-widest text-text-muted">Cidade</th>
                  <th className="py-3 text-[9px] uppercase tracking-widest text-text-muted">Entidade</th>
                  <th className="py-3 text-[9px] uppercase tracking-widest text-text-muted text-right">Vozes</th>
                  <th className="py-3 text-[9px] uppercase tracking-widest text-text-muted text-right">Aprovação</th>
                  <th className="py-3 text-[9px] uppercase tracking-widest text-text-muted text-right">Expectativa</th>
                </tr>
              </thead>
              <tbody>
                {data.territorio.candidatoPorCidade.slice(0, 12).map((item) => (
                  <tr key={`${item.cidade}-${item.candidato}`} className="border-b border-white/5">
                    <td className="py-3 text-[10px] uppercase tracking-widest text-text">{item.cidade}</td>
                    <td className="py-3 text-[10px] uppercase tracking-widest text-text-muted">{item.candidato}</td>
                    <td className="py-3 text-xs font-bold text-primary text-right">{item.manifestacoes}</td>
                    <td className="py-3 text-xs text-text text-right">{item.aprovacaoPct}%</td>
                    <td className="py-3 text-xs text-text text-right">{item.expectativaPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Perfil de Atributos por Político */}
      {data.atributosPorCandidato?.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-primary"><User size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest">Perfil de Atributos por Entidade</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60 mt-1">
                Clique em um nome para ver todos os atributos atribuídos
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {data.atributosPorCandidato.map(cand => {
              const aberto = abertos.has(cand.candidatoId);
              const virtudes = cand.atributos.filter(a => a.polaridade === 1);
              const negativos = cand.atributos.filter(a => a.polaridade === -1);
              const maxCount = Math.max(...cand.atributos.map(a => a.count), 1);

              return (
                <div key={cand.candidatoId} className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                  {/* Linha do candidato */}
                  <button
                    type="button"
                    onClick={() => toggleAberto(cand.candidatoId)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-text truncate">{cand.nome}</span>
                      <span className="text-[8px] uppercase text-text-muted tracking-widest shrink-0 hidden sm:block">{cand.cargo}</span>
                      {(cand as any).tipoEntidade && (cand as any).tipoEntidade !== 'politico' && (
                        <span className="text-[7px] font-bold uppercase tracking-widest text-[#c8933a] border border-[#c8933a]/40 rounded px-1.5 py-0.5 shrink-0 hidden sm:block">
                          {(cand as any).tipoEntidade === 'orgao_publico' ? 'Órgão' : 'Serviço'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-5 shrink-0">
                      <span className="text-[9px] text-text-muted tabular-nums">{cand.totalVozes} vozes</span>
                      <span className={`text-[9px] font-bold tabular-nums w-14 text-right ${cand.liquidScore >= 0 ? 'text-[#A8C47A]' : 'text-[#D97757]'}`}>
                        {cand.liquidScore >= 0 ? '+' : ''}{cand.liquidScore}
                      </span>
                      <span className="text-[9px] text-text-muted tabular-nums hidden sm:block">
                        {cand.atributos.length} atrib.
                      </span>
                      <motion.span
                        animate={{ rotate: aberto ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-primary text-xs font-bold"
                      >
                        ▶
                      </motion.span>
                    </div>
                  </button>

                  {/* Painel expansível */}
                  <AnimatePresence initial={false}>
                    {aberto && (
                      <motion.div
                        key="painel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5">
                          {/* Virtudes */}
                          <div className="flex flex-col gap-3">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-[#A8C47A] mb-1">Virtudes ({virtudes.length})</p>
                            {virtudes.length === 0 && <p className="text-[9px] text-text-muted">Nenhuma</p>}
                            {virtudes.map((a, i) => (
                              <div key={i} className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                  <span className="text-[10px] text-white uppercase tracking-wider">{a.nome}</span>
                                  <span className="text-[9px] text-text-muted tabular-nums">{a.count}×</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#A8C47A] rounded-full" style={{ width: `${(a.count / maxCount) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Negativos */}
                          <div className="flex flex-col gap-3">
                            <p className="text-[8px] font-bold uppercase tracking-widest text-[#D97757] mb-1">Negativos ({negativos.length})</p>
                            {negativos.length === 0 && <p className="text-[9px] text-text-muted">Nenhum</p>}
                            {negativos.map((a, i) => (
                              <div key={i} className="flex flex-col gap-1">
                                <div className="flex justify-between">
                                  <span className="text-[10px] text-white uppercase tracking-wider">{a.nome}</span>
                                  <span className="text-[9px] text-text-muted tabular-nums">{a.count}×</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                  <div className="h-full bg-[#D97757] rounded-full" style={{ width: `${(a.count / maxCount) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Grid de Relatórios */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* 1. Ranking Líquido */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Ranking: Score Líquido por Candidato</h3>
            <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Cruzamento: Candidato × Sentimento</p>
          </div>
          <RankingBarChart data={data.ranking} />
        </motion.div>

        {/* 2. Tendência de Sentimento */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Tendência de Sentimento — {dias} dias</h3>
            <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Cruzamento: Candidato × Tempo</p>
          </div>
          <TrendAreaChart data={data.tendencia} />
        </motion.div>

        {/* 3. Sentimento por Cargo */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Sentimento por Cargo Disputado</h3>
            <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Cruzamento: Cargo × Sentimento</p>
          </div>
          <CargoGroupedChart data={data.cargoSentimento} />
        </motion.div>

        {/* 4. Temas Mais Associados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest mb-2">Principais Temas e Pautas</h3>
            <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Frequência de Atributos Selecionados</p>
          </div>
          <TemaDonutChart data={data.temas} />
        </motion.div>

        {/* 5. Polarização vs Visibilidade */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-primary"><PieIcon size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Polarização vs. Visibilidade dos Candidatos</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Cruzamento: Volume (X) × Intensidade de Sentimento (Y)</p>
            </div>
          </div>
          <PolarizationScatterChart data={data.polarizacao} />
        </motion.div>

        {/* 6. Índice de Aprovação */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-[#A8C47A]"><ThumbsUp size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Índice de Aprovação Direta</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Baseado em sim/não da manifestação</p>
            </div>
          </div>
          <AprovacaoChart data={data.aprovacao} />
        </motion.div>

        {/* 7. Perfil Ideológico */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-blue-400"><User size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Distribuição Ideológica</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Perfil declarado do eleitorado</p>
            </div>
          </div>
          <DemographicRadarChart data={data.demografia.find((d: { categoria: string }) => d.categoria === 'ideologia')?.dados || []} />
        </motion.div>

        {/* 8. Top Atributos Detalhados */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-primary"><AlertCircle size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Diagnóstico de Imagem: Virtudes vs. Defeitos</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Top 5 atributos mais selecionados por polaridade</p>
            </div>
          </div>
          <TopAtributosChart data={data.topAtributos} />
        </motion.div>

        {/* 9. Concentração Regional */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 md:p-10"
        >
          <div className="mb-10 flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg text-orange-400"><MapPin size={14} /></div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Engajamento por Bairro</h3>
              <p className="text-[9px] text-text-muted uppercase tracking-widest opacity-60">Distribuição geográfica das participações</p>
            </div>
          </div>
          <BairroTreeMap data={data.bairros} />
        </motion.div>

      </div>
    </div>
  );
}
