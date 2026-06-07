'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminFetch } from '@/lib/adminClient';

const TIPO_LABEL: Record<string, string> = {
  politico: 'Político',
  orgao_publico: 'Órgão',
  servico_publico: 'Serviço',
};

interface Avaliacao {
  id: string;
  entidade: { nome: string; tipo: string };
  atributo: { nome: string };
  valor: number;
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
  avaliacoes: Avaliacao[];
  total: number;
  suspeitas: number;
  bots: number;
  ultimaData: string;
}

function agruparPorEntidade(avaliacoes: Avaliacao[]): GrupoEntidade[] {
  const mapa = new Map<string, Avaliacao[]>();
  for (const av of avaliacoes) {
    const chave = `${av.entidade.tipo}::${av.entidade.nome}`;
    if (!mapa.has(chave)) mapa.set(chave, []);
    mapa.get(chave)!.push(av);
  }
  return Array.from(mapa.entries()).map(([chave, avs]) => {
    const [tipo, nome] = chave.split('::');
    return {
      nome,
      tipo,
      avaliacoes: avs,
      total: avs.length,
      suspeitas: avs.filter(a => (a.duration_ms !== null && a.duration_ms < 8000) || a.honeypot_triggered).length,
      bots: avs.filter(a => a.honeypot_triggered).length,
      ultimaData: avs[0]?.criado_em ?? '',
    };
  });
}

export default function ModeracaoAdmin() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [stats, setStats] = useState({ total: 0, suspicious: 0, bots: 0 });
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  const toggleAberto = (nome: string) =>
    setAbertos(prev => { const n = new Set(prev); n.has(nome) ? n.delete(nome) : n.add(nome); return n; });

  const fetchData = async () => {
    try {
      const res = await adminFetch('/api/admin/moderacao');
      const data = await res.json();
      setAvaliacoes(data.avaliacoes);
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

  const grupos = useMemo(() => agruparPorEntidade(avaliacoes), [avaliacoes]);

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

      {/* Acordeão por candidato */}
      <div className="flex flex-col gap-2">
        <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest font-bold mb-2">
          {grupos.length} entidade(s) nas últimas 50 avaliações — clique para expandir
        </p>

        {grupos.map(grupo => {
          const aberto = abertos.has(`${grupo.tipo}::${grupo.nome}`);
          return (
            <div key={`${grupo.tipo}::${grupo.nome}`} className="bg-[#1c1814] border border-[#3d3128] rounded-2xl overflow-hidden">

              {/* Linha da entidade */}
              <button
                type="button"
                onClick={() => toggleAberto(`${grupo.tipo}::${grupo.nome}`)}
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

              {/* Painel expansível */}
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
                    <div className="border-t border-[#3d3128] overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead>
                          <tr className="bg-[#141413]">
                            <th className="px-6 py-3 text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">Data/Hora</th>
                            <th className="px-6 py-3 text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">Atributo</th>
                            <th className="px-6 py-3 text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">Duração</th>
                            <th className="px-6 py-3 text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">Status</th>
                            <th className="px-6 py-3 text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#3d3128]/60">
                          {grupo.avaliacoes.map(av => (
                            <tr
                              key={av.id}
                              className={`hover:bg-[#241e18] transition-colors ${!av.is_valid ? 'opacity-40' : ''}`}
                            >
                              <td className="px-6 py-3 text-[9px] text-[#7a6e64]">
                                {new Date(av.criado_em).toLocaleString('pt-BR')}
                              </td>
                              <td className="px-6 py-3 text-[10px] font-bold uppercase text-[#f5f0e8]">
                                {av.atributo.nome}
                              </td>
                              <td className="px-6 py-3 text-[10px]">
                                <span className={av.duration_ms !== null && av.duration_ms < 8000 ? 'text-red-400 font-bold' : 'text-[#7a6e64]'}>
                                  {av.duration_ms ? (av.duration_ms / 1000).toFixed(1) + 's' : 'N/A'}
                                  {av.duration_ms !== null && av.duration_ms < 8000 && ' ⚠'}
                                </span>
                              </td>
                              <td className="px-6 py-3">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[8px] font-bold uppercase tracking-widest ${av.is_valid ? 'text-green-500' : 'text-red-500'}`}>
                                    {av.is_valid ? '✓ Válido' : '✗ Inválido'}
                                  </span>
                                  {av.honeypot_triggered && (
                                    <span className="text-[7px] text-red-400 font-bold uppercase bg-red-400/10 px-2 py-0.5 rounded-full inline-block">
                                      BOT
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-3">
                                <button
                                  type="button"
                                  onClick={() => toggleValidity(av.id, av.is_valid)}
                                  className={`text-[9px] font-bold uppercase tracking-widest underline decoration-dotted transition-colors ${av.is_valid ? 'text-[#7a6e64] hover:text-red-400' : 'text-[#7a6e64] hover:text-green-400'}`}
                                >
                                  {av.is_valid ? 'Invalidar' : 'Validar'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
