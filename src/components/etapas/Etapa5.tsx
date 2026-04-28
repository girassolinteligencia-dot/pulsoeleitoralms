'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Fragmento } from '@/components/fragmento/Fragmento';

interface Atributo {
  id: string;
  nome: string;
  tipo: 'positivo' | 'negativo';
}

interface Candidato {
  id: string;
  nome: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
}

interface Etapa5Props {
  candidato: Candidato;
  evaluations: { atributoId: string; valor: number }[];
  onAttributeClick: (id: string, valor: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  parallax: { x: number; y: number };
  config?: any;
}

export const Etapa5: React.FC<Etapa5Props> = ({ 
  candidato, 
  evaluations, 
  onAttributeClick, 
  onSubmit, 
  isSubmitting,
  parallax,
  config
}) => {
  const atributosFixos: Atributo[] = [
    { id: 'pos1', nome: 'Ficha Limpa', tipo: 'positivo' },
    { id: 'pos2', nome: 'Experiência', tipo: 'positivo' },
    { id: 'pos3', nome: 'Propostas Claras', tipo: 'positivo' },
    { id: 'pos4', nome: 'Liderança', tipo: 'positivo' },
    { id: 'pos5', nome: 'Diálogo', tipo: 'positivo' },
    { id: 'pos6', nome: 'Inovação', tipo: 'positivo' },
    { id: 'pos7', nome: 'Transparência', tipo: 'positivo' },
    { id: 'pos8', nome: 'Compromisso Social', tipo: 'positivo' },
    { id: 'pos9', nome: 'Empatia', tipo: 'positivo' },
    { id: 'pos10', nome: 'Conhecimento Técnico', tipo: 'positivo' },
    { id: 'pos11', nome: 'Honestidade', tipo: 'positivo' },
    { id: 'pos12', nome: 'Foco em Resultados', tipo: 'positivo' },
    { id: 'pos13', nome: 'Visão de Futuro', tipo: 'positivo' },
    { id: 'pos14', nome: 'Sustentabilidade', tipo: 'positivo' },
    { id: 'pos15', nome: 'Ética Profissional', tipo: 'positivo' },
    { id: 'neg1', nome: 'Corrupção', tipo: 'negativo' },
    { id: 'neg2', nome: 'Promessas Vazias', tipo: 'negativo' },
    { id: 'neg3', nome: 'Inexperiência', tipo: 'negativo' },
    { id: 'neg4', nome: 'Radicalismo', tipo: 'negativo' },
    { id: 'neg5', nome: 'Falta de Ética', tipo: 'negativo' },
    { id: 'neg6', nome: 'Oportunismo', tipo: 'negativo' },
    { id: 'neg7', nome: 'Negligência', tipo: 'negativo' },
    { id: 'neg8', nome: 'Autoritarismo', tipo: 'negativo' },
    { id: 'neg9', nome: 'Incoerência', tipo: 'negativo' },
    { id: 'neg10', nome: 'Populismo', tipo: 'negativo' },
    { id: 'neg11', nome: 'Nepotismo', tipo: 'negativo' },
    { id: 'neg12', nome: 'Falta de Preparo', tipo: 'negativo' },
    { id: 'neg13', nome: 'Arrogância', tipo: 'negativo' },
    { id: 'neg14', nome: 'Desorganização', tipo: 'negativo' },
    { id: 'neg15', nome: 'Manipulação', tipo: 'negativo' },
  ];

  const atributosAtivos = config?.avaliacao_atributos_ativos || atributosFixos.map((a: any) => a.id);
  const atributosFiltrados = atributosFixos.filter(a => atributosAtivos.includes(a.id));

  const totalAtributos = atributosFiltrados.length;
  const progresso = (evaluations.length / totalAtributos) * 100;

  const getArcPosition = (index: number, total: number, radius: number) => {
    const angleStep = 360 / total;
    const angle = (angleStep * index) * (Math.PI / 180);
    return { x: Math.cos(angle) * radius, y: -Math.sin(angle) * radius };
  };

  return (
    <motion.div 
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Glow */}
      <AnimatePresence>
        {evaluations.length > 0 && (
          <motion.div 
            key={evaluations.length}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 bg-[#d97757] rounded-full blur-[120px] pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Progress Circle */}
      <div className="absolute z-15 w-[200px] h-[200px] sm:w-[240px] sm:h-[240px]">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="115" fill="none" stroke="#1c1814" strokeWidth="2" />
          <motion.circle
            cx="120"
            cy="120"
            r="115"
            fill="none"
            stroke="#d97757"
            strokeWidth="4"
            strokeDasharray="722"
            animate={{ strokeDashoffset: 722 - (722 * progresso) / 100 }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Central Photo */}
      <motion.div 
        className="relative z-20 w-[140px] h-[140px] sm:w-[170px] sm:h-[170px] rounded-full border-2 border-[#d97757] overflow-hidden shadow-[0_0_60px_rgba(217,119,87,0.4)] bg-[#1c1814]"
        style={{ x: parallax.x * 3, y: parallax.y * 3 }} 
      >
        {candidato.foto_url ? (
          <Image src={candidato.foto_url} alt={candidato.nome} width={170} height={170} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#d97757]/40 bg-[#1c1814]">
            <span className="text-xs font-bold uppercase tracking-widest">{candidato.nome.split(' ')[0]}</span>
          </div>
        )}
      </motion.div>

      {/* Orbital Attributes */}
      {atributosFiltrados.map((item, i) => {
        const isEvaluated = evaluations.some(e => e.atributoId === item.id);
        if (isEvaluated) return null;

        const orbitalRadius = 180;
        const pos = getArcPosition(i, totalAtributos, orbitalRadius);
        
        return (
          <motion.div 
            key={item.id}
            className="absolute z-30"
            style={{ left: `calc(50% + ${pos.x}px)`, top: `calc(50% + ${pos.y}px)` }}
            animate={{ x: parallax.x * 6, y: parallax.y * 6 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <Fragmento 
              id={item.id}
              label={item.nome} 
              type={item.tipo} 
              onClick={() => onAttributeClick(item.id, item.tipo === 'positivo' ? 1 : -1)} 
              style={{ width: '48px', height: '48px' }}
            />
          </motion.div>
        );
      })}

      {/* Info & Action */}
      <div className="absolute bottom-safe left-0 w-full px-6 flex flex-col items-center gap-6 z-40 pb-10">
        <div className="text-center">
          <h2 className="text-lg font-bold font-display uppercase tracking-[0.3em] text-[#f5f0e8] drop-shadow-[0_0_10px_rgba(245,240,232,0.3)]">{candidato.nome}</h2>
          <p className="text-[10px] text-[#b0aea5] font-body uppercase tracking-[0.5em] mt-2 font-bold">
            {candidato.cargo} | {candidato.cidade}
          </p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-[300px]">
          <button 
            onClick={onSubmit}
            disabled={evaluations.length === 0 || isSubmitting}
            className={`w-full py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.5em] transition-all duration-700 ${
              evaluations.length > 0 
                ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_40px_rgba(217,119,87,0.4)]' 
                : 'bg-[#1c1814] text-[#7a6e64] opacity-40 border border-[#3d3128]'
            }`}
          >
            {isSubmitting ? 'Ecoando...' : 'Finalizar Percepção'}
          </button>
          
          <motion.p className="text-[8px] text-[#7a6e64] uppercase tracking-widest font-bold">
            {evaluations.length === 0 ? 'Toque nos fragmentos orbitais' : `${evaluations.length} / ${totalAtributos} vinculados`}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
};
