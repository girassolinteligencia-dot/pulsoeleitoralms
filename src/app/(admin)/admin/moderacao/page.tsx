'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/adminClient';

const TIPO_LABEL: Record<string, string> = {
  politico: 'Político',
  orgao_publico: 'Órgão',
  servico_publico: 'Serviço',
};

interface AvaliacaoItem {
  id: string;
  atributo: { nome: string };
  valor: number;
}

interface Manifestacao {
  id: string;
  entidade: { nome: string; tipo: string };
  avaliacoes: AvaliacaoItem[];
  is_valid: boolean;
  fingerprint_hash: string;
  ip_hash: string;
  duration_ms: number | null;
  honeypot_triggered: boolean;
  criado_em: string;
}

interface GrupoEntidade {
  nome: string;
  tipo: string;
  manifestacoes: Manifestacao[];
  total: number;
  suspeitas: number;
  bots: number;
  ultimaData: string;
}

function agruparPorEntidade(manifestacoes: Manifestacao[]): GrupoEntidade[] {
  const mapa = new Map<string, Manifestacao[]>();
  for (const m of manifestacoes) {
    const chave = `${m.entidade.tipo}::${m.entidade.nome}`;
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave)!.push(m);
  }
  return Array.from(mapa.entries()).map(([chave, ms]) => {
    const [tipo, nome] = chave.split('::');
    return {
      nome,
      tipo,
      manifestacoes: ms,
      total: ms.length,
      suspeitas: ms.filter(m => (m.duration_ms !== null && m.duration_ms < 8000) || m.honeypot_triggered).length,
      bots: ms.filter(m => m.honeypot_triggered).length,
      ultimaData: ms[0]?.criado_em ?? '',
    };
  });
}

export default function ModeracaoAdmin() {
  const [manifestacoes, setManifestacoes] = useState<Manifestacao[]>([]);
  const [stats, setStats] = useState({ total: 0, suspicious: 0, bots: 0 });
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [abertosManif, setAbertosManif] = useState<Set<string>>(new Set());

  const toggleAberto = (chave: string) =>
    setAbertos(prev => { const n = new Set(prev); n.has(chave) ? n.delete(chave) : n.add(chave); return n; });

  const toggleManif = (id: string) =>
    setAbertosManif(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const fetchData = async () => {
    try {
      const res = await adminFetch('/api/admin/moderacao');
      const data = await res.json();
      setManifestacoes(data.manifestacoes);
      setStats(data.stats);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleValidity = async (id: string, currentStatus: boolean) => {
    try {
      const res = await adminFetch('/api/admin/moderacao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_valid: !currentStatus }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const grupos = useMemo(() => agruparPorEntidade(manifestacoes), [manifestacoes]);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-10">

      <div>
        <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Central de Moderação</h1>
        <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Monitoramento de Integridade e Auditoria</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Pulsos', value: stats.total, color: '#f5f0e8' },
          { label: 'Votos Válidos', value: stats.total - stats.suspicious, color: '#10b981' },
          { label: 'Atividade Suspeita', value: stats.suspicious, color: '#f59e0b' },
          { label: 'Bots Detectados', value: stats.bots, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bg-[#1c1814] border border-[#3d3128] rounded-3xl p-6">
            <p className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest mb-2">{s.label}</p>
            <p className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Acordeão por entidade */}
      <div className="flex flex-col gap-2">
        <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest font-bold mb-2">
          {grupos.length} entidade(s) nas últimas 50 avaliações — clique para expandir
        </p>

        {grupos.map(grupo => {
          const chaveGrupo = `${grupo.tipo}::${grupo.nome}`;
          const aberto = abertos.has(chaveGrupo);
          return (
            <div key={chaveGrupo} className="bg-[#1c1814] border border-[#3d3128] rounded-2xl overflow-hidden">

              {/* Linha da entidade */}
              <button
                type="button"
                onClick={() => toggleAberto(chaveGrupo)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-[#241e18] transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <motion.span
                    animate={{ rotate: aberto ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#d97757] text-[10px] font-bold shrink-0"
                  >
                    ▶
                  </motion.span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#f5f0e8] truncate">
                    {grupo.nome}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-[#7a6e64] border border-[#3d3128] rounded px-1.5 py-0.5 shrink-0 hidden sm:block">
                    {TIPO_LABEL[grupo.tipo] ?? grupo.tipo}
                  </span>
                </div>

                <div className="flex items-center gap-4 shrink-0 text-right">
                  <span className="text-[9px] text-[#7a6e64] tabular-nums">{grupo.total} aval.</span>
                  {grupo.suspeitas > 0 && (
                    <span className="text-[8px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                      {grupo.suspeitas} susp.
                    </span>
                  )}
                  {grupo.bots > 0 && (
                    <span className="text-[8px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                      {grupo.bots} bot
                    </span>
                  )}
                  <span className="text-[9px] text-[#7a6e64] hidden sm:block">
                    {new Date(grupo.ultimaData).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>

              {/* Lista de manifestações (ciclos completos) */}
              <AnimatePresence initial={false}>
                {aberto && (
                  <motion.div
                    key="painel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#3d3128] flex flex-col divide-y divide-[#3d3128]/60">
                      {grupo.manifestacoes.map((m, idx) => {
                        const manifAberta = abertosManif.has(m.id);
                        const suspeita = (m.duration_ms !== null && m.duration_ms < 8000) || m.honeypot_triggered;
                        return (
                          <div key={m.id} className={`${!m.is_valid ? 'opacity-40' : ''}`}>
                            {/* Linha da manifestação */}
                            <button
                              type="button"
                              onClick={() => toggleManif(m.id)}
                              className="w-full flex items-center justify-between gap-3 px-6 py-3 hover:bg-[#241e18] transition-colors text-left"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <motion.span
                                  animate={{ rotate: manifAberta ? 90 : 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-[#7a6e64] text-[8px] shrink-0"
                                >
                                  ▶
                                </motion.span>
                                <span className="text-[9px] font-bold text-[#f5f0e8] tabular-nums">
                                  #{idx + 1}
                                </span>
                                <span className="text-[9px] text-[#7a6e64]">
                                  {new Date(m.criado_em).toLocaleString('pt-BR')}
                                </span>
                                <span className="text-[9px] text-[#7a6e64] hidden sm:block">
                                  {m.avaliacoes.length} atributo{m.avaliacoes.length !== 1 ? 's' : ''}
                                </span>
                                {suspeita && (
                                  <span className="text-[7px] font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded-full">⚠ suspeito</span>
                                )}
                                {m.honeypot_triggered && (
                                  <span className="text-[7px] font-bold text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full">BOT</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${m.is_valid ? 'text-green-500' : 'text-red-500'}`}>
                                  {m.is_valid ? '✓ Válido' : '✗ Inválido'}
                                </span>
                                <button
                                  type="button"
                                  onClick={e => { e.stopPropagation(); toggleValidity(m.id, m.is_valid); }}
                                  className={`text-[9px] font-bold uppercase tracking-widest underline decoration-dotted transition-colors ${m.is_valid ? 'text-[#7a6e64] hover:text-red-400' : 'text-[#7a6e64] hover:text-green-400'}`}
                                >
                                  {m.is_valid ? 'Invalidar' : 'Validar'}
                                </button>
                              </div>
                            </button>

                            {/* Atributos da manifestação */}
                            <AnimatePresence initial={false}>
                              {manifAberta && (
                                <motion.div
                                  key="atribs"
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.18 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-10 pb-3 flex flex-wrap gap-2">
                                    {m.avaliacoes.map(av => (
                                      <span
                                        key={av.id}
                                        className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${av.valor > 0 ? 'border-green-500/30 text-green-400 bg-green-400/5' : 'border-red-500/30 text-red-400 bg-red-400/5'}`}
                                      >
                                        {av.valor > 0 ? '+' : '−'} {av.atributo.nome}
                                      </span>
                                    ))}
                                    {m.avaliacoes.length === 0 && (
                                      <span className="text-[8px] text-[#7a6e64] italic">sem atributos registrados</span>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {grupos.length === 0 && (
          <div className="py-20 text-center text-[#7a6e64] uppercase tracking-widest text-[10px]">
            Nenhuma avaliação encontrada
          </div>
        )}
      </div>
    </div>
  );
}
