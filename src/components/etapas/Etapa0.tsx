'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Etapa0Props {
  onNext: () => void;
}

const passos = [
  {
    numero: '01',
    icone: '📍',
    titulo: 'Informe sua região',
    descricao: 'Informe seu CEP para identificarmos sua cidade e bairro. O CEP completo não é salvo — usamos apenas para localização.',
  },
  {
    numero: '02',
    icone: '👤',
    titulo: 'Escolha o que avaliar',
    descricao: 'Selecione uma categoria — político(a), órgão ou serviço público — e busque pelo nome. Você pode avaliar mais de um.',
  },
  {
    numero: '03',
    icone: '✅',
    titulo: 'Avalie com sua percepção',
    descricao: 'Associe características ao que está avaliando. Não há resposta certa ou errada — apenas a sua visão.',
  },
];

export const Etapa0: React.FC<Etapa0Props> = ({ onNext }) => {
  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-6 overflow-y-auto pt-20 pb-10 no-scrollbar"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Cabeçalho */}
      <div className="text-center shrink-0 mb-10">
        <motion.h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Como funciona
        </motion.h1>
        <motion.p
          className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-3 font-bold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          Leva menos de 2 minutos
        </motion.p>
      </div>

      {/* Passos */}
      <div className="w-full max-w-sm flex flex-col gap-4 shrink-0">
        {passos.map((passo, i) => (
          <motion.div
            key={passo.numero}
            className="flex items-start gap-4 rounded-2xl border border-[#3d3128] bg-[#1c1814]/60 px-5 py-5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Ícone */}
            <div className="w-10 h-10 rounded-full bg-[#d97757]/10 border border-[#d97757]/30 flex items-center justify-center text-lg shrink-0 [filter:sepia(1)_saturate(3)_hue-rotate(340deg)_brightness(0.85)]">
              {passo.icone}
            </div>

            {/* Texto */}
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold font-display uppercase tracking-[0.1em] text-[#f5f0e8]">
                  {passo.titulo}
                </span>
              </div>
              <p className="text-[10px] text-[#7a6e64] leading-relaxed">
                {passo.descricao}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Separador */}
      <motion.div
        className="w-16 h-px bg-gradient-to-r from-transparent via-[#3d3128] to-transparent my-8 shrink-0"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      />

      {/* Reforço de privacidade */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-4 text-[#7a6e64] text-[8px] sm:text-[9px] uppercase tracking-widest font-bold shrink-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.75 }}
      >
        <span className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#d97757]" />
          Anônimo
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#c8933a]" />
          Sem cadastro
        </span>
        <span className="flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-[#a8c47a]" />
          Criptografado
        </span>
      </motion.div>

      {/* CTA */}
      <motion.div
        className="mt-10 shrink-0"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <button
          type="button"
          onClick={onNext}
          className="px-14 py-5 rounded-full bg-[#d97757] text-[#f5f0e8] font-bold text-[10px] uppercase tracking-[0.4em] font-display shadow-[0_0_50px_rgba(217,119,87,0.35)] hover:bg-[#c4633d] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          Começar →
        </button>
      </motion.div>
    </motion.div>
  );
};
