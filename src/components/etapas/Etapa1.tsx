'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import Link from 'next/link';

interface BairroPossivel {
  bairro: string;
  registros?: number;
  proporcao?: number;
}

interface CepLookupResponse {
  cidade?: string;
  bairro?: string;
  uf?: string;
  origem?: string;
  confiancaBairro?: number | null;
  precisaConfirmarBairro?: boolean;
  bairrosPossiveis?: BairroPossivel[];
  error?: string;
}

interface Etapa1Props {
  userData: {
    ideologia: string;
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
  config?: any;
}

export const Etapa1: React.FC<Etapa1Props> = ({ userData, setUserData, onNext, config }) => {
  const [cep, setCep] = React.useState('');
  const [cepStatus, setCepStatus] = React.useState<'idle' | 'loading' | 'found' | 'error'>('idle');
  const [cepMessage, setCepMessage] = React.useState('');

  const ideologias = [
    { id: 'esquerda', label: 'Progressista', color: '#a8c47a' },
    { id: 'centro-esquerda', label: 'Centro-Esquerda', color: '#8fb88e' },
    { id: 'centro', label: 'Moderado', color: '#c8933a' },
    { id: 'centro-direita', label: 'Centro-Direita', color: '#d99d57' },
    { id: 'direita', label: 'Conservador', color: '#d97757' },
  ];

  const normalizedCep = cep.replace(/\D/g, '');
  const canResolveLater = userData.localidadeOrigem === 'manual_pendente';
  const isComplete = Boolean(userData.ideologia && ((userData.cidade && userData.bairro) || canResolveLater));

  const updateCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    const formatted = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setCep(formatted);
    setCepStatus('idle');
    setCepMessage('');
  };

  const lookupCep = async () => {
    if (!/^\d{8}$/.test(normalizedCep)) {
      setCepStatus('error');
      setCepMessage('Digite um CEP com 8 números.');
      return;
    }

    setCepStatus('loading');
    setCepMessage('');

    try {
      const res = await fetch(`/api/cep/${normalizedCep}`);
      const data = await res.json() as CepLookupResponse;

      if (!res.ok) {
        throw new Error(data.error || 'CEP não encontrado.');
      }

      const bairrosPossiveis = Array.isArray(data.bairrosPossiveis)
        ? data.bairrosPossiveis.filter((item) => item.bairro)
        : [];

      setUserData({
        ...userData,
        cidade: data.cidade || '',
        bairro: data.bairro || bairrosPossiveis[0]?.bairro || '',
        uf: data.uf || 'MS',
        localidadeOrigem: data.origem === 'ibge_enderecos' ? 'cep_ibge' : 'cep',
        bairrosPossiveis,
        bairroConfianca: data.confiancaBairro ?? null,
        precisaConfirmarBairro: !!data.precisaConfirmarBairro,
      });
      setCepStatus('found');
      setCepMessage(
        data.precisaConfirmarBairro
          ? 'Encontramos mais de uma localidade para este CEP. Você só precisará confirmar o bairro.'
          : 'Região localizada. Você seguirá direto para a busca de candidato.'
      );
    } catch (error) {
      setUserData({
        ...userData,
        cidade: '',
        bairro: '',
        uf: 'MS',
        localidadeOrigem: 'manual_pendente',
        bairrosPossiveis: [],
        bairroConfianca: null,
        precisaConfirmarBairro: true,
      });
      setCepStatus('error');
      setCepMessage(
        `${error instanceof Error ? error.message : 'Não foi possível consultar o CEP.'} Você poderá informar cidade e bairro manualmente.`
      );
    }
  };

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-8 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-3xl md:text-4xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {config?.onboarding_etapa1_titulo || 'Sua região'}
        </h1>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-3 font-bold drop-shadow-sm">
          Sem identificação nominal
        </p>
      </div>

      <div className="w-full max-w-[340px] flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            CEP de onde mora
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              value={cep}
              onChange={(e) => updateCep(e.target.value)}
              className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-2xl px-6 py-5 pr-14 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8] shadow-inner"
              placeholder="00000-000"
            />
            <button
              type="button"
              onClick={lookupCep}
              disabled={cepStatus === 'loading'}
              aria-label="Buscar região pelo CEP"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-[#d97757]/10 text-[#d97757] flex items-center justify-center hover:bg-[#d97757]/20 disabled:opacity-40 transition-colors"
            >
              <Search size={18} />
            </button>
          </div>

          <p className="text-[10px] text-[#7a6e64] leading-relaxed">
            O CEP é usado apenas para localizar cidade e bairro. O CEP completo não será salvo na manifestação.
            {' '}
            <Link href="/privacidade" className="text-[#c8933a] underline underline-offset-2">
              Ver privacidade
            </Link>
          </p>

          {cepMessage && (
            <div className={`rounded-xl border px-4 py-3 text-[10px] leading-relaxed ${
              cepStatus === 'error'
                ? 'border-[#d97757]/30 bg-[#d97757]/10 text-[#d97757]'
                : 'border-[#a8c47a]/30 bg-[#a8c47a]/10 text-[#a8c47a]'
            }`}>
              {cepMessage}
            </div>
          )}

          {(userData.cidade || userData.bairro) && (
            <div className="flex items-start gap-3 rounded-xl border border-[#3d3128] bg-[#1c1814]/60 px-4 py-3">
              <MapPin size={16} className="text-[#c8933a] mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#f5f0e8] break-words">
                  {[userData.bairro, userData.cidade, userData.uf].filter(Boolean).join(' • ')}
                </p>
                <p className="text-[9px] text-[#7a6e64] mt-1">
                  {userData.precisaConfirmarBairro
                    ? 'Este CEP tem mais de uma localidade possível.'
                    : 'Você poderá corrigir depois, se precisar.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest text-center drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
            Sua Linha Ideológica
          </label>
          
          <div className="flex flex-col gap-3">
            {ideologias.map((item) => {
              const isSelected = userData.ideologia === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setUserData({ ...userData, ideologia: item.id })}
                  className={`group relative w-full py-4 px-6 rounded-2xl border transition-all duration-500 flex items-center justify-between ${
                    isSelected 
                      ? 'bg-[#1c1814] border-[#d97757] shadow-[0_0_20px_rgba(217,119,87,0.15)]' 
                      : 'bg-transparent border-[#3d3128] hover:border-[#7a6e64]'
                  }`}
                >
                  <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                    isSelected ? 'text-[#f5f0e8]' : 'text-[#7a6e64] group-hover:text-[#b0aea5]'
                  }`}>
                    {item.label}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" 
                      style={{ color: item.color, backgroundColor: item.color }} 
                    />
                    {isSelected && (
                      <motion.div 
                        layoutId="check-ideology"
                        className="w-4 h-4 bg-[#d97757] rounded-full flex items-center justify-center text-[8px] text-white"
                      >
                        ✓
                      </motion.div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-auto pb-8">
        <button 
          onClick={() => onNext()}
          disabled={!isComplete}
          className={`relative z-50 px-14 py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] transition-all duration-700 ${
            isComplete
              ? 'bg-[#d97757] text-[#f5f0e8] shadow-[0_0_50px_rgba(217,119,87,0.4)] scale-100 hover:scale-105 active:scale-95 cursor-pointer' 
              : 'bg-[#1c1814] text-[#7a6e64] opacity-20 scale-95 cursor-not-allowed border border-[#3d3128]'
          }`}
        >
          Avançar
        </button>
      </div>
    </motion.div>
  );
};
