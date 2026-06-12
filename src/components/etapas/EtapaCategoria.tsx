'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, UserSquare2, Wrench, Heart, GraduationCap, Bus, Shield, HardHat, Leaf } from 'lucide-react';

export type Categoria = 'politico' | 'orgao_publico' | 'servico_publico' | 'saude' | 'educacao' | 'transporte' | 'seguranca' | 'infraestrutura' | 'meio_ambiente';

interface OpcaoCategoria {
  id: Categoria;
  icone: React.ReactNode;
  titulo: string;
  descricao: string;
  disponivel: boolean;
}

const opcoes: OpcaoCategoria[] = [
  {
    id: 'politico',
    icone: <UserSquare2 size={28} />,
    titulo: 'Políticos',
    descricao: 'Prefeitos, vereadores, governadores, deputados, senadores e presidentes.',
    disponivel: true,
  },
  {
    id: 'orgao_publico',
    icone: <Building2 size={28} />,
    titulo: 'Órgãos Públicos',
    descricao: 'Prefeitura, câmara, tribunais, ministério público e defensorias.',
    disponivel: true,
  },
  {
    id: 'servico_publico',
    icone: <Wrench size={28} />,
    titulo: 'Serviços Públicos',
    descricao: 'UPAs, UBSs, hospitais, transporte, concessionárias e infraestrutura.',
    disponivel: true,
  },
  {
    id: 'saude',
    icone: <Heart size={28} />,
    titulo: 'Saúde Pública',
    descricao: 'Avalie a qualidade dos serviços de saúde pública na sua região.',
    disponivel: false,
  },
  {
    id: 'educacao',
    icone: <GraduationCap size={28} />,
    titulo: 'Educação Pública',
    descricao: 'Escolas, universidades e secretarias de educação.',
    disponivel: false,
  },
  {
    id: 'seguranca',
    icone: <Shield size={28} />,
    titulo: 'Segurança Pública',
    descricao: 'Polícias, guardas municipais e órgãos de segurança.',
    disponivel: false,
  },
];

interface EtapaCategoriaProps {
  onSelect: (categoria: Categoria) => void;
  onBack: () => void;
}

export const EtapaCategoria: React.FC<EtapaCategoriaProps> = ({ onSelect, onBack }) => {
  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-4 sm:px-6 gap-6 overflow-y-auto pt-20 sm:pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          O que avaliar?
        </h1>
        <p className="text-[11px] sm:text-xs text-[#b0aea5] uppercase tracking-[0.28em] sm:tracking-[0.4em] mt-2 font-bold leading-relaxed">
          ESCOLHA A CATEGORIA
        </p>
      </div>

      <div className="w-full max-w-xl flex flex-col gap-3 mt-2">
        {opcoes.map((opcao, i) => (
          <motion.div
            key={opcao.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {opcao.disponivel ? (
              <motion.button
                type="button"
                onClick={() => onSelect(opcao.id)}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-4 sm:p-5 flex items-center gap-4 group transition-all hover:border-[#d97757]/60 hover:bg-[#d97757]/5 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-[#141413] border border-[#3d3128] flex items-center justify-center shrink-0 text-[#d97757] group-hover:border-[#d97757]/60 transition-all">
                  {opcao.icone}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#f5f0e8] group-hover:text-[#d97757] transition-colors">
                    {opcao.titulo}
                  </span>
                  <span className="text-sm text-[#7a6e64] leading-relaxed">
                    {opcao.descricao}
                  </span>
                </div>
                <div className="shrink-0 w-2 h-2 rounded-full bg-[#a8c47a] opacity-70 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ) : (
              <div className="w-full bg-[#1c1814]/30 border border-[#3d3128]/50 rounded-xl p-4 sm:p-5 flex items-center gap-4 opacity-45 cursor-not-allowed text-left">
                <div className="w-12 h-12 rounded-full bg-[#141413] border border-[#3d3128]/50 flex items-center justify-center shrink-0 text-[#7a6e64]">
                  {opcao.icone}
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#7a6e64]">
                      {opcao.titulo}
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#c8933a] border border-[#c8933a]/40 rounded px-1.5 py-0.5">
                      Em Breve
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-[#5a4e44] leading-relaxed">
                    {opcao.descricao}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="mt-auto pb-10 flex flex-col items-center gap-4 w-full shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.24em] hover:text-[#f5f0e8] transition-colors"
        >
          <ArrowLeft size={14} />
          Voltar
        </button>
      </div>
    </motion.div>
  );
};
