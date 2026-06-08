'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BairroPossivel {
  bairro: string;
  registros?: number;
  proporcao?: number;
}

interface Etapa3Props {
  userData: {
    cidade: string;
    bairro: string;
    uf?: string;
    localidadeOrigem?: string;
    bairrosPossiveis?: BairroPossivel[];
    bairroConfianca?: number | null;
    precisaConfirmarBairro?: boolean;
  };
  setUserData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  cidades: string[];
}

export const Etapa3: React.FC<Etapa3Props> = ({ userData, setUserData, onNext, onBack, cidades }) => {
  const isComplete = userData.cidade && userData.bairro;
  const bairrosPossiveis = userData.bairrosPossiveis || [];
  const hasBairrosPossiveis = bairrosPossiveis.length > 1;
  const isManualPending = userData.localidadeOrigem === 'manual_pendente' || (!userData.cidade && !userData.bairro);
  const title = isManualPending
    ? 'Informe sua região'
    : hasBairrosPossiveis
      ? 'Confirme seu bairro'
      : 'Corrigir região';
  const subtitle = isManualPending
    ? 'CEP não localizado'
    : 'Cidade e bairro da manifestação';

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-8 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {title}
        </h1>
        <p className="text-xs text-[#b0aea5] uppercase tracking-[0.4em] mt-2 font-bold">
          {subtitle}
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-8">
        {!isManualPending && (
          <div className="rounded-2xl border border-[#3d3128] bg-[#1c1814]/55 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#8d8177] font-bold">
              Região detectada pelo CEP
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-[#f5f0e8] leading-relaxed">
              {[userData.bairro, userData.cidade, userData.uf || 'MS'].filter(Boolean).join(' • ')}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-[11px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Sua Cidade
          </label>
          <div className="relative">
            <input
              type="text"
              value={userData.cidade}
              onChange={(e) => setUserData({
                ...userData,
                cidade: e.target.value,
                uf: 'MS',
                localidadeOrigem: userData.localidadeOrigem || 'manual',
              })}
              list="cidades-ms"
              title="Informe sua cidade"
              className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all text-[#f5f0e8] placeholder:text-[#7a6e64]/50"
              placeholder="Digite sua cidade"
            />
            <datalist id="cidades-ms">
              {cidades.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>
        </div>

        {hasBairrosPossiveis && (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#3d3128] bg-[#1c1814]/55 p-4">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] uppercase font-bold text-[#c8933a] tracking-widest">
                Localidades encontradas pelo CEP
              </p>
              <p className="text-sm text-[#8d8177] leading-relaxed">
                Escolha a opção que melhor representa onde você mora. Se nenhuma servir, corrija manualmente abaixo.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {bairrosPossiveis.map((item) => {
                const selected = userData.bairro === item.bairro;
                const confidenceLabel = typeof item.proporcao === 'number'
                  ? `${Math.round(item.proporcao * 100)}%`
                  : '';

                return (
                  <button
                    key={item.bairro}
                    type="button"
                    onClick={() => setUserData({
                      ...userData,
                      bairro: item.bairro,
                      bairroConfianca: item.proporcao ?? userData.bairroConfianca ?? null,
                      precisaConfirmarBairro: false,
                      localidadeOrigem: 'cep_ibge_confirmado',
                    })}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                      selected
                        ? 'border-[#d97757] bg-[#d97757]/10 text-[#f5f0e8]'
                        : 'border-[#3d3128] bg-[#141413]/50 text-[#b0aea5] hover:border-[#7a6e64]'
                    }`}
                  >
                    <span className="min-w-0 text-[10px] font-bold uppercase tracking-[0.16em] break-words">
                      {item.bairro}
                    </span>
                    {confidenceLabel && (
                      <span className="shrink-0 rounded-full border border-[#3d3128] px-2 py-1 text-[11px] text-[#8d8177]">
                        {confidenceLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <label className="text-[11px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Seu Bairro
          </label>
          <input 
            type="text" 
            value={userData.bairro}
            onChange={(e) => setUserData({
              ...userData,
              bairro: e.target.value,
              localidadeOrigem: 'manual',
              bairroConfianca: null,
              precisaConfirmarBairro: false,
              bairrosPossiveis: [],
            })}
            className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8]"
            placeholder="Digite seu bairro"
          />
        </div>
      </div>

      <div className="mt-auto pb-8 flex flex-col items-center gap-4 w-full">
        <button 
          onClick={() => onNext()}
          disabled={!isComplete}
          className={`w-full max-w-[300px] px-14 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
            isComplete
              ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_50px_rgba(217,119,87,0.4)] scale-100 opacity-100' 
              : 'bg-[#1c1814] text-[#7a6e64] opacity-20 scale-95 cursor-not-allowed border border-[#3d3128]'
          }`}
        >
          Confirmar região
        </button>
        <button 
          onClick={onBack} 
          className="text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.3em] hover:text-[#f5f0e8] transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </motion.div>
  );
};
