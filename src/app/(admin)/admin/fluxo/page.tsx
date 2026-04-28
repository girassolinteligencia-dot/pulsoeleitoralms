'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/ui/Header';

interface Parametro {
  id: string;
  chave: string;
  valor: any;
  grupo: string;
  descricao: string | null;
}

export default function FluxoAdmin() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchParametros = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/configuracoes');
      const data = await res.json();
      setParametros(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParametros();
  }, [fetchParametros]);

  const updateParametro = async (chave: string, valor: any) => {
    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, valor })
      });
      if (res.ok) {
        fetchParametros();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getParam = (chave: string) => parametros.find(p => p.chave === chave)?.valor;

  if (loading) return null;

  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] pt-24 px-8 pb-20 font-body">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Configuração do Fluxo</h1>
          <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Gerencie as etapas e perguntas da plataforma</p>
        </header>

        <div className="flex flex-col gap-12">
          {/* Seção 0: Textos das Etapas */}
          <section className="bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#c8933a]/10 flex items-center justify-center text-[#c8933a] text-xl">📝</div>
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-[#f5f0e8]">Textos e Rótulos</h2>
                <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest mt-1">Personalize as mensagens de cada etapa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputConfig 
                chave="onboarding_etapa1_titulo" 
                label="Título Etapa 1" 
                placeholder="Identificação"
                value={getParam('onboarding_etapa1_titulo')} 
                onUpdate={updateParametro} 
              />
              <InputConfig 
                chave="onboarding_etapa2_titulo" 
                label="Título Etapa 2" 
                placeholder="Perfil"
                value={getParam('onboarding_etapa2_titulo')} 
                onUpdate={updateParametro} 
              />
            </div>
          </section>

          {/* Seção 1: Dados Demográficos */}
          <section className="bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#d97757]/10 flex items-center justify-center text-[#d97757] text-xl">👤</div>
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-[#f5f0e8]">Dados Demográficos</h2>
                <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest mt-1">Defina quais campos serão exibidos na Etapa 2</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {['sexo', 'cor', 'escolaridade', 'estadoCivil', 'faixaSalarial', 'religiao', 'ocupacao', 'filhos', 'orientacaoSexual', 'deficiencia', 'tempoResidencia'].map((campo) => {
                const config = getParam('onboarding_campos') || {};
                const isActive = config[campo] !== false;

                return (
                  <button 
                    key={campo}
                    onClick={() => updateParametro('onboarding_campos', { ...config, [campo]: !isActive })}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                      isActive 
                        ? 'bg-[#d97757]/10 border-[#d97757] text-[#f5f0e8]' 
                        : 'bg-[#141413] border-[#3d3128] text-[#7a6e64]'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                      {campo.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isActive ? 'bg-[#d97757]' : 'bg-[#3d3128]'}`}>
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Seção 2: Filtro de Pleito */}
          <section className="bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#d97757]/10 flex items-center justify-center text-[#d97757] text-xl">📅</div>
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-[#f5f0e8]">Filtro de Pleito</h2>
                <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest mt-1">Restrinja a busca para um ano eleitoral específico</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Ano Ativo para Busca</label>
              <div className="flex gap-3">
                {[2020, 2022, 2024, 2026].map(ano => {
                  const activeYear = getParam('geral_ano_pleito') || 2024;
                  const isSelected = activeYear === ano;
                  
                  return (
                    <button 
                      key={ano}
                      onClick={() => updateParametro('geral_ano_pleito', ano)}
                      className={`px-6 py-3 rounded-xl border text-[10px] font-bold transition-all ${
                        isSelected 
                          ? 'bg-[#d97757] border-[#d97757] text-[#f5f0e8]' 
                          : 'bg-[#141413] border-[#3d3128] text-[#7a6e64]'
                      }`}
                    >
                      {ano}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Seção 3: Atributos de Avaliação */}
          <section className="bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] p-8 md:p-10">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 rounded-full bg-[#c8933a]/10 flex items-center justify-center text-[#c8933a] text-xl">✨</div>
              <div>
                <h2 className="text-xl font-bold font-display uppercase tracking-wider text-[#f5f0e8]">Matriz de Atributos</h2>
                <p className="text-[9px] text-[#7a6e64] uppercase tracking-widest mt-1">Ative ou oculte atributos na Etapa 5 (Plasma)</p>
              </div>
            </div>

            <p className="text-[10px] text-[#7a6e64] uppercase tracking-widest mb-6 font-bold">Dica: Selecione pelo menos 4 para uma boa experiência visual.</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(i => (
                <div key={i} className="flex flex-col gap-2">
                  <AttrToggle id={`pos${i}`} label={`Positivo ${i}`} type="positivo" activeParams={getParam('avaliacao_atributos_ativos') || []} onToggle={updateParametro} />
                  <AttrToggle id={`neg${i}`} label={`Negativo ${i}`} type="negativo" activeParams={getParam('avaliacao_atributos_ativos') || []} onToggle={updateParametro} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function InputConfig({ chave, label, placeholder, value, onUpdate }: any) {
  const [localValue, setLocalValue] = useState(value || '');

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onUpdate(chave, localValue)}
        className="w-full bg-[#141413] border border-[#3d3128] rounded-2xl px-5 py-4 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#d97757]"
        placeholder={placeholder}
      />
    </div>
  );
}

function AttrToggle({ id, label, type, activeParams, onToggle }: any) {
  const isActive = activeParams.includes(id);
  
  return (
    <button 
      onClick={() => {
        const newParams = isActive ? activeParams.filter((p: string) => p !== id) : [...activeParams, id];
        onToggle('avaliacao_atributos_ativos', newParams);
      }}
      className={`px-4 py-3 rounded-xl border text-[8px] font-bold uppercase tracking-widest transition-all ${
        isActive 
          ? (type === 'positivo' ? 'bg-green-500/10 border-green-500 text-green-500' : 'bg-red-500/10 border-red-500 text-red-500')
          : 'bg-[#141413] border-[#3d3128] text-[#7a6e64]'
      }`}
    >
      {label}
    </button>
  );
}
