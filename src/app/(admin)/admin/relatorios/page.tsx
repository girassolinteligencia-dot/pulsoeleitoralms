'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/ui/Header';
import { RadarChart } from '@/components/resultado/RadarChart';

interface CandidatoRelatorio {
  id: string;
  nome: string;
  cargo: string;
  total_avaliacoes: number;
  resultados: { atributo: string; valor: number; total: number }[];
}

export default function RelatoriosAdmin() {
  const [candidatos, setCandidatos] = useState<CandidatoRelatorio[]>([]);
  const [selectedCandidato, setSelectedCandidato] = useState<CandidatoRelatorio | null>(null);

  async function fetchRelatorio() {
    try {
      const res = await fetch('/api/admin/relatorios');
      const data = await res.json();
      setCandidatos(data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchRelatorio();
  }, []);

  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] pt-24 px-8 pb-12 font-body">
      <Header />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Relatórios de Inteligência</h1>
            <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Consolidação de Percepção MS-2026</p>
          </div>
          
          <button 
            onClick={() => window.print()}
            className="px-6 py-3 bg-[#1c1814] border border-[#3d3128] text-[#f5f0e8] rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-[#d97757] transition-all"
          >
            Exportar Relatório
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar: Lista de Candidatos */}
          <div className="lg:col-span-1 flex flex-col gap-3 h-[70vh] overflow-y-auto no-scrollbar pr-2">
            <p className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest mb-2 ml-2">Selecione o Candidato</p>
            {candidatos.map((cand) => (
              <button 
                key={cand.id}
                onClick={() => setSelectedCandidato(cand)}
                className={`w-full p-5 rounded-2xl border text-left transition-all ${selectedCandidato?.id === cand.id ? 'bg-[#d97757] border-[#d97757] text-white shadow-lg' : 'bg-[#1c1814] border-[#3d3128] text-[#7a6e64] hover:border-[#d97757]/50'}`}
              >
                <p className="text-[11px] font-bold uppercase tracking-wider mb-1">{cand.nome}</p>
                <div className="flex justify-between items-center opacity-60">
                  <span className="text-[8px] uppercase tracking-tighter">{cand.cargo}</span>
                  <span className="text-[8px] font-bold">{cand.total_avaliacoes} Pulsos</span>
                </div>
              </button>
            ))}
          </div>

          {/* Main: Gráfico e Detalhes */}
          <div className="lg:col-span-3">
            {selectedCandidato ? (
              <motion.div 
                key={selectedCandidato.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#1c1814] border border-[#3d3128] rounded-[3rem] p-10 h-full flex flex-col"
              >
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">{selectedCandidato.nome}</h2>
                    <p className="text-[10px] text-[#d97757] uppercase tracking-[0.3em] font-bold mt-1">{selectedCandidato.cargo}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-widest mb-1">Amostra Consolidada</p>
                    <p className="text-xl font-bold font-display text-[#f5f0e8]">{selectedCandidato.total_avaliacoes} Votos Válidos</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-12">
                  <div className="w-full max-w-[450px] aspect-square">
                    <RadarChart data={selectedCandidato.resultados} />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
                    {selectedCandidato.resultados.map((res) => (
                      <div key={res.atributo} className="bg-[#141413] p-4 rounded-2xl border border-[#3d3128]">
                        <p className="text-[8px] uppercase font-bold text-[#7a6e64] tracking-widest mb-1">{res.atributo}</p>
                        <p className="text-lg font-bold font-display text-[#d97757]">{(res.valor * 100).toFixed(0)}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-[#1c1814]/30 border-2 border-dashed border-[#3d3128] rounded-[3rem] text-[#7a6e64]">
                <p className="text-[10px] uppercase font-bold tracking-[0.4em]">Selecione um perfil para visualizar a inteligência</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
