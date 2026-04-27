'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Fragmento } from '../fragmento/Fragmento';

interface Etapa2Props {
  onSelect: (cargo: string) => void;
  onBack: () => void;
  cidade: string;
}

export const Etapa2: React.FC<Etapa2Props> = ({ onSelect, onBack, cidade }) => {
  const cargos = [
    { label: 'Presidente', icon: '🇧🇷' },
    { label: 'Governador', icon: '🏛️' },
    { label: 'Senador', icon: '⚖️' },
    { label: 'Deputado Federal', icon: '🤝' },
    { label: 'Deputado Estadual', icon: '📝' },
    { label: 'Prefeito', icon: '🏙️' },
    { label: 'Vereador', icon: '🏠' }
  ];

  return (
    <>
      {/* Background Decorativo: Micro-fragmentos */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] left-[5%]">
          <Fragmento id="e2-bg-1" label="" type="positivo" style={{ width: '100px', height: '100px', filter: 'blur(20px)' }} />
        </div>
        <div className="absolute bottom-[20%] right-[10%]">
          <Fragmento id="e2-bg-2" label="" type="negativo" style={{ width: '80px', height: '80px', filter: 'blur(15px)' }} />
        </div>
        <div className="absolute top-[40%] right-[20%]">
          <Fragmento id="e2-bg-3" label="" type="perfil" style={{ width: '120px', height: '120px', filter: 'blur(25px)' }} />
        </div>
      </div>

      <motion.div 
        className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 gap-10"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center">
          <span className="text-[9px] font-bold text-[#d97757] uppercase tracking-[0.4em] mb-3 block">Selecione a</span>
          <h1 className="text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Esfera</h1>
          <p className="text-[10px] text-[#7a6e64] uppercase tracking-widest mt-3 font-bold">
            Cargos disponíveis para <span className="text-[#c8933a]">{cidade}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 w-full max-w-[320px]">
          {cargos.map((c) => (
            <motion.button 
              key={c.label}
              whileHover={{ x: 10, backgroundColor: '#1c1814', borderColor: '#d97757' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(c.label)}
              className="w-full bg-[#1c1814]/50 backdrop-blur-md border border-[#3d3128] rounded-3xl py-5 px-6 text-[11px] uppercase font-bold tracking-[0.2em] text-[#f5f0e8] text-left flex justify-between items-center transition-all group"
            >
              <div className="flex items-center gap-5">
                <span className="w-10 h-10 rounded-full bg-[#141413] flex items-center justify-center text-lg group-hover:bg-[#d97757]/20 transition-colors">
                  {c.icon}
                </span>
                {c.label}
              </div>
              <span className="text-[#d97757] opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0">
                →
              </span>
            </motion.button>
          ))}
        </div>
        
        <button 
          onClick={onBack} 
          className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.3em] hover:text-[#f5f0e8] transition-colors"
        >
          ← Voltar para Identificação
        </button>
      </motion.div>
    </>
  );
};
