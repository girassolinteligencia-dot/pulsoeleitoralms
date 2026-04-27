'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Fragmento } from '../fragmento/Fragmento';

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

interface Etapa3Props {
  cargo: string;
  cidade: string;
  candidatos: Candidato[];
  onSelect: (candidato: Candidato) => void;
  onBack: () => void;
}

export const Etapa3: React.FC<Etapa3Props> = ({ cargo, cidade, candidatos, onSelect, onBack }) => {
  return (
    <>
      {/* Background Decorativo: Micro-fragmentos */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] right-[10%]">
          <Fragmento id="e3-bg-1" label="" type="positivo" style={{ width: '150px', height: '150px', filter: 'blur(30px)' }} />
        </div>
        <div className="absolute bottom-[10%] left-[5%]">
          <Fragmento id="e3-bg-2" label="" type="perfil" style={{ width: '180px', height: '180px', filter: 'blur(40px)' }} />
        </div>
      </div>

      <motion.div 
        className="relative z-10 w-full h-full flex flex-col items-center pt-24 px-6 gap-8 overflow-y-auto pb-24 no-scrollbar"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center w-full">
          <span className="text-[9px] font-bold text-[#d97757] uppercase tracking-[0.4em] mb-3 block">Seleção de</span>
          <h1 className="text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">{cargo}</h1>
          <p className="text-[10px] text-[#7a6e64] uppercase tracking-widest mt-3 font-bold">
            Candidatos em <span className="text-[#c8933a]">{cidade}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 w-full max-w-[380px]">
          {candidatos.map((cand) => (
            <motion.button 
              key={cand.id}
              onClick={() => onSelect(cand)}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(217, 119, 87, 0.1)' }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden bg-[#1c1814]/80 backdrop-blur-xl border border-[#3d3128] rounded-[2.5rem] p-6 flex flex-col items-center gap-5 transition-all group"
            >
              {/* Background Glow */}
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#d97757]/10 blur-2xl rounded-full group-hover:bg-[#d97757]/20 transition-all" />
              
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-[#141413] border-2 border-[#3d3128] group-hover:border-[#d97757] overflow-hidden flex items-center justify-center transition-all shadow-2xl">
                  {cand.foto_url ? (
                    <Image 
                      src={cand.foto_url} 
                      alt={cand.nome} 
                      width={112}
                      height={112}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-110 group-hover:scale-100"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#d97757]/40 uppercase tracking-widest">Sem Foto</span>
                  )}
                </div>
              </div>

              <div className="text-center">
                <p className="text-[12px] font-bold uppercase tracking-widest leading-tight text-[#f5f0e8] group-hover:text-[#d97757] transition-colors">
                  {cand.nome}
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full bg-[#141413] text-[7px] font-bold uppercase text-[#7a6e64] tracking-widest border border-[#3d3128]">
                    VOZ-2026
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {candidatos.length === 0 && (
          <div className="text-center py-20">
            <p className="text-[#7a6e64] text-xs uppercase font-bold tracking-widest">Nenhum candidato encontrado nesta categoria.</p>
          </div>
        )}

        <button 
          onClick={onBack} 
          className="mt-6 px-8 py-4 rounded-full bg-[#1c1814] border border-[#3d3128] text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.2em] hover:text-[#f5f0e8] transition-colors"
        >
          ← Alterar Cargo
        </button>
      </motion.div>
    </>
  );
};
