'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RadarChart } from '@/components/resultado/RadarChart';
import Image from 'next/image';
import { Fragmento } from '../fragmento/Fragmento';

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

interface Etapa5Props {
  results: ResultData[];
  candidatoNome: string;
  onReset: () => void;
}

export const Etapa5: React.FC<Etapa5Props> = ({ results, candidatoNome, onReset }) => {
  const totalVozes = results.reduce((acc, curr) => acc + curr.total, 0);

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col items-center justify-center px-8 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Background Decorativo: Fragmentos Ambientais */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <Fragmento id="amb-1" label="" type="positivo" style={{ position: 'absolute', top: '15%', left: '10%', scale: 0.6 }} />
        <Fragmento id="amb-2" label="" type="perfil" style={{ position: 'absolute', bottom: '25%', right: '5%', scale: 0.5 }} />
        <Fragmento id="amb-3" label="" type="negativo" style={{ position: 'absolute', top: '20%', right: '15%', scale: 0.4 }} />
      </div>

      {/* Selo Girassol de Transparência */}
      <div className="absolute top-24 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20">
        <Image src="/gi/logo-32.png" alt="GI" width={20} height={20} />
        <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Auditoria Pública MS-2026</span>
      </div>

      <div className="text-center mb-10 mt-12">
        <h2 className="text-2xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Inteligência da Voz</h2>
        <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.3em] font-bold mt-3">
          Percepção coletiva: <span className="text-[#d97757]">{candidatoNome}</span>
        </p>
      </div>

      {/* Radar Chart com Núcleo de Plasma */}
      <div className="relative w-full max-w-[360px] aspect-square flex items-center justify-center">
        {/* Fragmento de Núcleo (Atrás do gráfico) */}
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40 blur-3xl pointer-events-none scale-150">
          <Fragmento id="result-core" label="" type="positivo" />
        </div>
        
        <div className="relative z-10 w-full h-full bg-[#1c1814]/40 backdrop-blur-xl rounded-[3rem] border border-[#3d3128] p-8 shadow-2xl flex items-center justify-center">
          <RadarChart data={results} />
        </div>
      </div>

      {/* Estatísticas de Engajamento */}
      <motion.div 
        className="mt-12 w-full max-w-[320px] flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <div className="flex justify-between items-end px-1">
          <div className="flex flex-col gap-1">
            <span className="text-[8px] text-[#7a6e64] uppercase tracking-[0.4em] font-bold">Engajamento Coletivo</span>
            <span className="text-xl font-bold font-display text-[#f5f0e8] tabular-nums">{totalVozes.toLocaleString()}</span>
          </div>
          <span className="text-[10px] text-[#d97757] font-bold uppercase tracking-widest pb-1">Vozes Ativas</span>
        </div>
        
        {/* Barra de Energia Visual */}
        <div className="h-1 w-full bg-[#1c1814] rounded-full overflow-hidden border border-[#3d3128]/50">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#d97757] via-[#c8933a] to-[#d97757] bg-[length:200%_100%]" 
            initial={{ width: 0 }} 
            animate={{ width: '100%', backgroundPosition: ['0% 0%', '100% 0%'] }} 
            transition={{ 
              width: { duration: 2.5, ease: 'circOut' },
              backgroundPosition: { duration: 4, repeat: Infinity, ease: 'linear' }
            }} 
          />
        </div>
      </motion.div>

      {/* CTA Final */}
      <motion.button 
        onClick={onReset} 
        whileHover={{ scale: 1.02, backgroundColor: '#1c1814' }}
        whileTap={{ scale: 0.98 }}
        className="mt-20 px-16 py-5 rounded-full bg-transparent text-[#f5f0e8] border border-[#3d3128] font-bold text-[9px] uppercase tracking-[0.5em] transition-all shadow-xl backdrop-blur-sm"
      >
        Nova Manifestação
      </motion.button>

      {/* Rodapé de Créditos */}
      <div className="absolute bottom-8 text-center opacity-30">
        <p className="text-[7px] uppercase font-bold tracking-[0.5em] text-[#7a6e64]">
          Desenvolvido por Girassol Inteligência
        </p>
      </div>
    </motion.div>
  );
};
