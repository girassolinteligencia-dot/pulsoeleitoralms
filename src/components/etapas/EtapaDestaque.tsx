'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, ArrowRight } from 'lucide-react';

export interface EntidadeDestaque {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  foto_url?: string | null;
}

interface EtapaDestaqueProps {
  categoria: 'orgao_publico' | 'servico_publico';
  destaques: EntidadeDestaque[];
  resultadosBusca: EntidadeDestaque[];
  buscando: boolean;
  onSelect: (entidade: EntidadeDestaque) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
  onSugestao?: () => void;
}

const TIPO_LABEL: Record<string, string> = {
  prefeitura: 'Prefeitura',
  camara: 'Câmara',
  tribunal: 'Tribunal',
  ministerio_publico: 'MP',
  defensoria: 'Defensoria',
  tce: 'TCE',
  governo_estadual: 'Gov. Estadual',
  assembleia: 'Assembleia',
  upa: 'UPA',
  ubs: 'UBS',
  hospital: 'Hospital',
  transporte: 'Transporte',
  agua: 'Água',
  energia: 'Energia',
  outro: 'Outro',
};

const TITULO: Record<string, string> = {
  orgao_publico: 'Órgãos Públicos',
  servico_publico: 'Serviços Públicos',
};

const PLACEHOLDER: Record<string, string> = {
  orgao_publico: 'Buscar órgão por nome…',
  servico_publico: 'Buscar serviço por nome…',
};

export const EtapaDestaque: React.FC<EtapaDestaqueProps> = ({
  categoria,
  destaques,
  resultadosBusca,
  buscando,
  onSelect,
  onSearch,
  onBack,
  onSugestao,
}) => {
  const [query, setQuery] = useState('');
  const [buscouAgora, setBuscouAgora] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setBuscouAgora(true);
    onSearch(query.trim());
  };

  const limparBusca = () => {
    setQuery('');
    setBuscouAgora(false);
  };

  const mostrarResultados = buscouAgora && query.trim().length > 0;

  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-4 sm:px-6 gap-5 overflow-y-auto pt-20 sm:pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
    >
      {/* Título */}
      <div className="text-center shrink-0 max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {TITULO[categoria]}
        </h1>
        <p className="text-[11px] sm:text-xs text-[#b0aea5] uppercase tracking-[0.28em] sm:tracking-[0.4em] mt-2 font-bold leading-relaxed">
          Selecione ou busque
        </p>
      </div>

      {/* Grid de destaques */}
      {!mostrarResultados && destaques.length > 0 && (
        <div className="w-full max-w-xl grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {destaques.slice(0, 9).map((ent, i) => (
            <motion.button
              key={ent.id}
              type="button"
              onClick={() => onSelect(ent)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex flex-col items-center justify-center gap-2 bg-[#1c1814]/60 border border-[#3d3128] rounded-2xl px-2 py-4 sm:py-5 text-center hover:border-[#d97757]/60 hover:bg-[#1c1814] active:scale-95 transition-all group"
            >
              {ent.foto_url ? (
                <img
                  src={ent.foto_url}
                  alt={ent.nome}
                  className="w-10 h-10 rounded-full object-cover border border-[#3d3128] shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#d97757]/10 border border-[#d97757]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#d97757] text-xs font-bold">
                    {ent.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="w-full">
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide text-[#f5f0e8] group-hover:text-[#d97757] transition-colors leading-snug line-clamp-2">
                  {ent.nome}
                </p>
                <p className="text-[8px] text-[#7a6e64] uppercase tracking-widest mt-0.5 truncate">
                  {TIPO_LABEL[ent.tipo] ?? ent.tipo}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {!mostrarResultados && destaques.length === 0 && (
        <p className="text-xs text-[#7a6e64] uppercase tracking-widest opacity-50">
          Use a busca abaixo para encontrar
        </p>
      )}

      {/* Divisor + campo de busca */}
      <div className="w-full max-w-xl">
        {destaques.length > 0 && !mostrarResultados && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#3d3128]" />
            <span className="text-[8px] uppercase font-bold tracking-widest text-[#7a6e64]">
              Não encontrou?
            </span>
            <div className="flex-1 h-px bg-[#3d3128]" />
          </div>
        )}

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); if (!e.target.value.trim()) limparBusca(); }}
            placeholder={PLACEHOLDER[categoria]}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8] pr-12"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-lg text-[#d97757] hover:bg-[#d97757]/10 transition-colors flex items-center justify-center"
          >
            <Search size={18} />
          </button>
        </form>
      </div>

      {/* Resultados da busca */}
      {mostrarResultados && (
        <div className="w-full max-w-xl flex flex-col gap-3 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-bold tracking-widest text-[#7a6e64]">
              {buscando ? 'Buscando…' : `${resultadosBusca.length} resultado${resultadosBusca.length !== 1 ? 's' : ''}`}
            </p>
            <button type="button" onClick={limparBusca} className="text-[9px] uppercase font-bold tracking-widest text-[#d97757] hover:opacity-70 transition-opacity">
              ← Ver destaques
            </button>
          </div>

          {!buscando && resultadosBusca.length === 0 && (
            <p className="text-center py-10 text-xs text-[#7a6e64] uppercase tracking-widest opacity-50">
              Nenhum resultado encontrado
            </p>
          )}

          {resultadosBusca.map(ent => (
            <motion.button
              type="button"
              key={ent.id}
              onClick={() => onSelect(ent)}
              whileHover={{ x: 5 }}
              className="w-full bg-[#1c1814]/50 border border-[#3d3128] rounded-xl p-3.5 flex items-center gap-3 group transition-all text-left hover:border-[#d97757]/40"
            >
              {ent.foto_url ? (
                <img src={ent.foto_url} alt={ent.nome} className="w-10 h-10 rounded-full object-cover border border-[#3d3128] shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#d97757]/10 border border-[#d97757]/20 flex items-center justify-center shrink-0">
                  <span className="text-[#d97757] text-xs font-bold">{ent.nome.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#f5f0e8] group-hover:text-[#d97757] transition-colors leading-snug">
                  {ent.nome}
                </p>
                <p className="text-[8px] text-[#7a6e64] uppercase tracking-widest mt-0.5">
                  {TIPO_LABEL[ent.tipo] ?? ent.tipo} · {ent.cidade}
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-[#d97757] opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      )}

      {/* Voltar */}
      <div className="mt-auto pb-8 flex flex-col items-center gap-4 w-full">
        {onSugestao && (
          <button
            type="button"
            onClick={onSugestao}
            className="text-[9px] uppercase font-bold text-[#c8933a] tracking-[0.24em] hover:text-[#f5f0e8] transition-colors"
          >
            Não encontrei — sugerir cadastro
          </button>
        )}
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
