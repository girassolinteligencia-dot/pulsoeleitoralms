'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ThumbsUp, ThumbsDown, Zap, Cloud } from 'lucide-react';

interface PerguntaConfig {
  titulo: string;
  pergunta: string;
  labelSim: string;
  labelNao: string;
  subLabelSim?: string;
  subLabelNao?: string;
  corSim?: string;
  corNao?: string;
  iconSim?: React.ReactNode;
  iconNao?: React.ReactNode;
}

interface EtapaFinalProps {
  aprovacaoConfig: PerguntaConfig;
  expectativaConfig: PerguntaConfig;
  onSubmit: (aprovacao: boolean, expectativa: boolean) => void;
  onBack: () => void;
}

function BotaoResposta({
  label,
  subLabel,
  cor,
  icon,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  subLabel?: string;
  cor: string;
  icon: React.ReactNode;
  selected: boolean | null;
  disabled?: boolean;
  onClick: () => void;
}) {
  const isSelected = selected === true;
  const isDimmed = selected !== null && !isSelected;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      className={`
        flex-1 flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border transition-all duration-300
        ${isSelected
          ? `border-current bg-current/10 shadow-[0_0_20px_rgba(0,0,0,0.2)]`
          : isDimmed
            ? 'border-white/5 bg-white/[0.02] opacity-30'
            : 'border-[#3d3128] bg-[#1c1814]/50 hover:border-current hover:bg-current/5'
        }
        ${disabled && !isSelected ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
      `}
      style={{ color: isSelected || (!isDimmed && !disabled) ? cor : undefined }}
    >
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'border-current bg-current/20' : 'border-[#3d3128]'}`}>
        {icon}
      </div>
      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.15em] leading-tight text-center text-[#f5f0e8]">
        {label}
      </span>
      {subLabel && (
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-[#7a6e64] leading-tight text-center">{subLabel}</span>
      )}
    </motion.button>
  );
}

export const EtapaFinal: React.FC<EtapaFinalProps> = ({
  aprovacaoConfig,
  expectativaConfig,
  onSubmit,
  onBack,
}) => {
  const [aprovacao, setAprovacao] = useState<boolean | null>(null);
  const [expectativa, setExpectativa] = useState<boolean | null>(null);

  const ambosRespondidos = aprovacao !== null && expectativa !== null;

  const handleAprovacao = (val: boolean) => {
    setAprovacao(val);
  };

  const handleExpectativa = (val: boolean) => {
    setExpectativa(val);
    if (aprovacao !== null) {
      setTimeout(() => onSubmit(aprovacao, val), 300);
    }
  };

  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-4 sm:px-6 overflow-y-auto pt-16 sm:pt-20 pb-safe no-scrollbar"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-lg flex flex-col gap-5">

        {/* Pergunta 1 — Aprovação */}
        <div className="flex flex-col gap-3">
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold font-display uppercase tracking-tight text-[#f5f0e8]">
              {aprovacaoConfig.titulo}
            </h2>
            <p className="text-[13px] text-[#b0aea5] uppercase tracking-[0.15em] mt-1 font-bold leading-relaxed max-w-xs mx-auto">
              {aprovacaoConfig.pergunta}
            </p>
          </div>
          <div className="flex gap-3">
            <BotaoResposta
              label={aprovacaoConfig.labelSim}
              subLabel={aprovacaoConfig.subLabelSim}
              cor={aprovacaoConfig.corSim ?? '#a8c47a'}
              icon={aprovacaoConfig.iconSim ?? <ThumbsUp size={18} />}
              selected={aprovacao === true ? true : aprovacao === false ? false : null}
              onClick={() => handleAprovacao(true)}
            />
            <BotaoResposta
              label={aprovacaoConfig.labelNao}
              subLabel={aprovacaoConfig.subLabelNao}
              cor={aprovacaoConfig.corNao ?? '#d97757'}
              icon={aprovacaoConfig.iconNao ?? <ThumbsDown size={18} />}
              selected={aprovacao === false ? true : aprovacao === true ? false : null}
              onClick={() => handleAprovacao(false)}
            />
          </div>
        </div>

        {/* Divisor */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#2a2420]" />
          <span className="text-[8px] uppercase tracking-[0.3em] font-bold text-[#4a3f35]">E TAMBÉM</span>
          <div className="flex-1 h-px bg-[#2a2420]" />
        </div>

        {/* Pergunta 2 — Expectativa */}
        <AnimatePresence>
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: aprovacao === null ? 0.35 : 1 }}
            animate={{ opacity: aprovacao === null ? 0.35 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="text-center">
              <h2 className="text-base sm:text-lg font-bold font-display uppercase tracking-tight text-[#f5f0e8]">
                {expectativaConfig.titulo}
              </h2>
              <p className="text-[13px] text-[#b0aea5] uppercase tracking-[0.15em] mt-1 font-bold leading-relaxed max-w-xs mx-auto">
                {expectativaConfig.pergunta}
              </p>
            </div>
            <div className="flex gap-3">
              <BotaoResposta
                label={expectativaConfig.labelSim}
                subLabel={expectativaConfig.subLabelSim}
                cor={expectativaConfig.corSim ?? '#c8933a'}
                icon={expectativaConfig.iconSim ?? <Zap size={18} />}
                selected={expectativa === true ? true : expectativa === false ? false : null}
                disabled={aprovacao === null}
                onClick={() => handleExpectativa(true)}
              />
              <BotaoResposta
                label={expectativaConfig.labelNao}
                subLabel={expectativaConfig.subLabelNao}
                cor={expectativaConfig.corNao ?? '#7a6e64'}
                icon={expectativaConfig.iconNao ?? <Cloud size={18} />}
                selected={expectativa === false ? true : expectativa === true ? false : null}
                disabled={aprovacao === null}
                onClick={() => handleExpectativa(false)}
              />
            </div>
            {aprovacao === null && (
              <p className="text-center text-[9px] uppercase tracking-widest text-[#4a3f35] font-bold">
                Responda a primeira pergunta para liberar
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Voltar */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.22em] hover:text-[#f5f0e8] transition-colors"
          >
            <ArrowLeft size={13} />
            Voltar aos Atributos
          </button>
        </div>
      </div>
    </motion.div>
  );
};
