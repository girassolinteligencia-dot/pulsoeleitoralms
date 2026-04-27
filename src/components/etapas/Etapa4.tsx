'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Fragmento } from '@/components/fragmento/Fragmento';

interface Atributo {
  id: string;
  nome: string;
}

interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
  campanha: {
    atributos: { atributo: Atributo }[];
  };
}

interface Etapa4Props {
  candidato: Candidato;
  evaluations: { atributoId: string; valor: number }[];
  onAttributeClick: (id: string, valor: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  parallax: { x: number; y: number };
}

export const Etapa4: React.FC<Etapa4Props> = ({ 
  candidato, 
  evaluations, 
  onAttributeClick, 
  onSubmit, 
  isSubmitting,
  parallax 
}) => {
  const totalAtributos = candidato.campanha.atributos.length;
  const progresso = (evaluations.length / totalAtributos) * 100;

  const getArcPosition = (index: number, total: number, startAngle: number, endAngle: number, radius: number) => {
    const angleRange = endAngle - startAngle;
    const angleStep = angleRange / (total - 1 || 1);
    const angle = (startAngle + angleStep * index) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: -Math.sin(angle) * radius };
  };

  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pulsante quando avalia */}
      <AnimatePresence>
        {evaluations.length > 0 && (
          <motion.div 
            key={evaluations.length}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-[#d97757] rounded-full blur-[100px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Energy Bar (Radial) */}
      <div className="absolute z-15 w-[180px] h-[180px]">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="90"
            cy="90"
            r="85"
            fill="none"
            stroke="#1c1814"
            strokeWidth="2"
          />
          <motion.circle
            cx="90"
            cy="90"
            r="85"
            fill="none"
            stroke="#d97757"
            strokeWidth="4"
            strokeDasharray="534"
            animate={{ strokeDashoffset: 534 - (534 * progresso) / 100 }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Foto Central (Camada de Foco) */}
      <motion.div 
        className="relative z-20 w-[150px] h-[150px] rounded-full border-2 border-[#d97757] overflow-hidden shadow-[0_0_60px_rgba(217,119,87,0.4)] bg-[#1c1814]"
        style={{ x: parallax.x * 2, y: parallax.y * 2 }} 
        animate={evaluations.length > 0 ? { scale: [1, 1.05, 1] } : {}}
      >
        {candidato.foto_url ? (
          <Image 
            src={candidato.foto_url} 
            alt={candidato.nome} 
            width={150}
            height={150}
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#d97757]/40 bg-[#1c1814]">
            <span className="text-[12px] font-bold uppercase tracking-widest">{candidato.nome.split(' ')[0]}</span>
          </div>
        )}
      </motion.div>

      {/* Halo de Foco */}
      <motion.div
        className="absolute z-10 w-[210px] h-[210px] rounded-full border border-[#d97757]/10 blur-xl"
        style={{ x: parallax.x * 4, y: parallax.y * 4 }}
        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      {/* Fragmentos de Plasma (Orbitais) */}
      {candidato.campanha.atributos.map((attr, i) => {
        const item = attr.atributo;
        const isEvaluated = evaluations.some(e => e.atributoId === item.id);
        if (isEvaluated) return null;

        // Positioning in arc (Bottom arc 120deg to 420deg)
        const pos = getArcPosition(i, totalAtributos, 120, 420, 165);
        
        return (
          <motion.div 
            key={item.id}
            className="absolute z-30"
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            animate={{ x: parallax.x * 6, y: parallax.y * 6 }}
            exit={{ 
              scale: 0, 
              x: -pos.x, 
              y: -pos.y, 
              opacity: 0, 
              transition: { type: 'spring', stiffness: 200, damping: 20 } 
            }}
          >
            <Fragmento 
              id={item.id}
              label={item.nome} 
              type="positivo" 
              onClick={() => onAttributeClick(item.id, 1)} 
            />
          </motion.div>
        );
      })}

      {/* Overlay de Informação e CTA */}
      <div className="absolute bottom-12 left-0 w-full px-8 flex flex-col items-center gap-6 z-40">
        <div className="text-center">
          <h2 className="text-lg font-bold font-display uppercase tracking-[0.2em] text-[#d97757]">{candidato.nome}</h2>
          <p className="text-[10px] text-[#7a6e64] font-body uppercase tracking-widest mt-1">
            {candidato.cargo} | {candidato.cidade}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button 
            onClick={onSubmit}
            disabled={evaluations.length === 0 || isSubmitting}
            className={`px-12 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
              evaluations.length > 0 
                ? 'bg-[#d97757] text-[#f5f0e8] shadow-2xl shadow-[#d97757]/40 scale-100 hover:scale-105 active:scale-95' 
                : 'bg-[#1c1814] text-[#7a6e64] opacity-40 cursor-not-allowed border border-[#3d3128]'
            }`}
          >
            {isSubmitting ? 'Sincronizando...' : 'Ecoar Voz'}
          </button>
          
          <motion.p 
            key={evaluations.length}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 0.6, y: 0 }}
            className="text-[8px] text-[#7a6e64] uppercase tracking-widest"
          >
            {evaluations.length === 0 ? 'Toque nos fragmentos para avaliar' : `${evaluations.length} atributos vinculados à sua voz`}
          </motion.p>
        </div>
      </div>

      {/* Grão de Fundo (Camada de Textura) */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-[url('/gi/noise.png')]" />
    </motion.div>
  );
};
