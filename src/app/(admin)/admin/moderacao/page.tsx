'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/ui/Header';

interface Avaliacao {
  id: string;
  candidato: { nome: string };
  atributo: { nome: string };
  valor: number;
  is_valid: boolean;
  fingerprint_hash: string;
  ip_hash: string;
  duration_ms: number | null;
  honeypot_triggered: boolean;
  criado_em: string;
}

export default function ModeracaoAdmin() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [stats, setStats] = useState({ total: 0, suspicious: 0, bots: 0 });

  async function fetchAvaliacoes() {
    try {
      const res = await fetch('/api/admin/moderacao');
      const data = await res.json();
      setAvaliacoes(data.avaliacoes);
      setStats(data.stats);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const toggleValidity = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/moderacao', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_valid: !currentStatus })
      });
      if (res.ok) fetchAvaliacoes();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] pt-24 px-8 pb-12 font-body">
      <Header />
      
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Central de Moderação</h1>
          <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Monitoramento de Integridade e Auditoria</p>
        </div>

        {/* Painel de Estatísticas de Segurança */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total de Vozes', value: stats.total, color: '#f5f0e8' },
            { label: 'Votos Válidos', value: stats.total - stats.suspicious, color: '#10b981' },
            { label: 'Atividade Suspeita', value: stats.suspicious, color: '#f59e0b' },
            { label: 'Bots Detectados', value: stats.bots, color: '#ef4444' }
          ].map((s) => (
            <div key={s.label} className="bg-[#1c1814] border border-[#3d3128] rounded-3xl p-6">
              <p className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest mb-2">{s.label}</p>
              <p className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista de Avaliações Recentes */}
        <div className="bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#141413] border-b border-[#3d3128]">
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Data/Hora</th>
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Candidato</th>
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Atributo</th>
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Duração</th>
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d3128]">
                {avaliacoes.map((av) => (
                  <tr key={av.id} className={`hover:bg-[#241e18] transition-colors ${!av.is_valid ? 'opacity-40' : ''}`}>
                    <td className="px-8 py-5 text-[10px] text-[#7a6e64]">{new Date(av.criado_em).toLocaleString()}</td>
                    <td className="px-8 py-5 text-[11px] font-bold uppercase tracking-wider">{av.candidato.nome}</td>
                    <td className="px-8 py-5 text-[11px] text-[#7a6e64] font-bold uppercase">{av.atributo.nome}</td>
                    <td className="px-8 py-5 text-[10px]">
                      <span className={av.duration_ms && av.duration_ms < 8000 ? 'text-red-500 font-bold' : 'text-[#7a6e64]'}>
                        {av.duration_ms ? (av.duration_ms / 1000).toFixed(1) + 's' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${av.is_valid ? 'text-green-500' : 'text-red-500'}`}>
                          {av.is_valid ? '✓ Válido' : '✗ Inválido'}
                        </span>
                        {av.honeypot_triggered && (
                          <span className="text-[7px] text-red-500 font-bold uppercase tracking-tighter bg-red-500/10 px-2 py-0.5 rounded-full inline-block">BOT DETECTADO</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <button 
                        onClick={() => toggleValidity(av.id, av.is_valid)}
                        className={`text-[9px] font-bold uppercase tracking-widest underline decoration-dotted transition-colors ${av.is_valid ? 'hover:text-red-500' : 'hover:text-green-500'}`}
                      >
                        {av.is_valid ? 'Invalidar' : 'Validar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
