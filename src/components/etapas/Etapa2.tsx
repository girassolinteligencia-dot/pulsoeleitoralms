'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Etapa2Props {
  userData: {
    sexo: string;
    cor: string;
    escolaridade: string;
    estadoCivil: string;
    faixaSalarial: string;
    religiao: string;
    ocupacao: string;
    filhos: string;
    orientacaoSexual: string;
    deficiencia: string;
    tempoResidencia: string;
  };
  setUserData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  config?: any;
}

export const Etapa2: React.FC<Etapa2Props> = ({ userData, setUserData, onNext, onBack, config }) => {
  const options = {
    sexo: ['Masculino', 'Feminino', 'Outro', 'Prefiro não dizer'],
    cor: ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Outra'],
    escolaridade: ['Sem Instrução', 'Fundamental', 'Médio', 'Superior', 'Pós-graduação', 'Doutorado/Mestrado'],
    estadoCivil: ['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)', 'União Estável'],
    faixaSalarial: ['Até 1 salário', '1 a 3 salários', '3 a 6 salários', '6 a 10 salários', 'Acima de 10 salários'],
    religiao: ['Católica', 'Evangélica', 'Espírita', 'Matriz Africana', 'Ateu/Agnóstico', 'Outra'],
    ocupacao: ['Setor Privado', 'Servidor Público', 'Autônomo', 'Desempregado', 'Estudante', 'Aposentado'],
    filhos: ['Nenhum', '1 filho', '2 filhos', '3 ou mais'],
    orientacaoSexual: ['Heterossexual', 'LGBTQIAPN+', 'Outra', 'Prefiro não dizer'],
    deficiencia: ['Nenhuma', 'Física', 'Visual', 'Auditiva', 'Intelectual/Outra'],
    tempoResidencia: ['Menos de 2 anos', '2 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'],
  };

  const activeFields = config?.onboarding_campos || {
    sexo: true, cor: true, escolaridade: true, estadoCivil: true, faixaSalarial: true,
    religiao: true, ocupacao: true, filhos: true, orientacaoSexual: true, deficiencia: true, tempoResidencia: true
  };

  const isComplete = (
    (!activeFields.sexo || userData.sexo) &&
    (!activeFields.cor || userData.cor) &&
    (!activeFields.escolaridade || userData.escolaridade) &&
    (!activeFields.estadoCivil || userData.estadoCivil) &&
    (!activeFields.faixaSalarial || userData.faixaSalarial) &&
    (!activeFields.religiao || userData.religiao) &&
    (!activeFields.ocupacao || userData.ocupacao) &&
    (!activeFields.filhos || userData.filhos) &&
    (!activeFields.orientacaoSexual || userData.orientacaoSexual) &&
    (!activeFields.deficiencia || userData.deficiencia) &&
    (!activeFields.tempoResidencia || userData.tempoResidencia)
  );

  const renderSelect = (label: string, field: keyof typeof options, current: string) => {
    if (activeFields[field] === false) return null;

    return (
      <div className="flex flex-col gap-2 w-full">
        <label className="text-[11px] uppercase font-bold text-[#d97757] tracking-widest ml-1 drop-shadow-[0_0_8px_rgba(217,119,87,0.3)]">
          {label}
        </label>
        <div className="grid grid-cols-2 gap-2">
          {options[field].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setUserData({ ...userData, [field]: opt })}
              className={`py-3.5 px-3 rounded-xl border text-[11px] font-bold uppercase tracking-tighter transition-all duration-300 ${
                current === opt 
                  ? 'bg-[#d97757] border-[#d97757] text-[#f5f0e8] shadow-[0_0_15px_rgba(217,119,87,0.3)]' 
                  : 'bg-[#1c1814]/50 border-[#3d3128] text-[#7a6e64] hover:border-[#7a6e64]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      className="relative z-10 w-full h-full flex flex-col items-center px-6 gap-6 overflow-y-auto pt-24 pb-safe no-scrollbar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0">
        <h1 className="text-2xl sm:text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {config?.onboarding_etapa2_titulo || 'Perfil'}
        </h1>
        <p className="text-[10px] text-[#b0aea5] uppercase tracking-[0.4em] mt-2 font-bold">
          DADOS DEMOGRÁFICOS
        </p>
      </div>

      <div className="w-full max-w-sm flex flex-col gap-6 pb-10">
        {renderSelect('Sexo', 'sexo', userData.sexo)}
        {renderSelect('Cor/Raça', 'cor', userData.cor)}
        {renderSelect('Escolaridade', 'escolaridade', userData.escolaridade)}
        {renderSelect('Estado Civil', 'estadoCivil', userData.estadoCivil)}
        {renderSelect('Renda Mensal', 'faixaSalarial', userData.faixaSalarial)}
        {renderSelect('Religião', 'religiao', userData.religiao)}
        {renderSelect('Ocupação', 'ocupacao', userData.ocupacao)}
        {renderSelect('Filhos', 'filhos', userData.filhos)}
        {renderSelect('Orientação Sexual', 'orientacaoSexual', userData.orientacaoSexual)}
        {renderSelect('Deficiência', 'deficiencia', userData.deficiencia)}
        {renderSelect('Tempo de Residência', 'tempoResidencia', userData.tempoResidencia)}
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
          Avançar
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
