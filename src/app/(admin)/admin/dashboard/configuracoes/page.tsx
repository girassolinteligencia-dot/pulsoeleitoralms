'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Parametro {
  id?: string;
  chave: string;
  valor: string | number | boolean | object;
  grupo: string;
  descricao: string | null;
}

interface CampanhaOption {
  id: string;
  nome: string;
  status: string;
  public_scope?: {
    candidatos_visiveis: number;
  };
  _count?: {
    candidatos: number;
  };
}

export default function ConfigAdmin() {
  const [parametros, setParametros] = useState<Parametro[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingParam, setEditingParam] = useState<Partial<Parametro> | null>(null);

  const fetchParametros = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/configuracoes');
      const data = await res.json();
      setParametros(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampanhas = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/campanhas?limit=100');
      const data = await res.json();
      setCampanhas(data.data || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchParametros(), fetchCampanhas()]);
    };
    init();
  }, [fetchParametros, fetchCampanhas]);

  const updateParametro = async (
    chave: string,
    valor: string | number | boolean | object,
    grupo = 'geral',
    descricao: string | null = null
  ) => {
    try {
      const res = await adminFetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, valor, grupo, descricao })
      });
      if (res.ok) {
        await fetchParametros();
        if (chave.startsWith('public_')) {
          await fetchCampanhas();
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveParametro = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editingParam?.chave) return;
    try {
      let formattedValor = editingParam.valor;
      try {
        if (typeof editingParam.valor === 'string' && (editingParam.valor.startsWith('{') || editingParam.valor.startsWith('['))) {
          formattedValor = JSON.parse(editingParam.valor);
        }
      } catch {
        // Keep as string if parse fails
      }

      const res = await adminFetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingParam, valor: formattedValor })
      });
      if (res.ok) {
        setEditingParam(null);
        fetchParametros();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getParam = (chave: string) => parametros.find(p => p.chave === chave)?.valor;
  const getNumberArrayParam = (chave: string) => {
    const value = getParam(chave);
    return Array.isArray(value)
      ? value.map(Number).filter(item => Number.isInteger(item))
      : [];
  };
  const getStringArrayParam = (chave: string) => {
    const value = getParam(chave);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  };
  const publicYears = getNumberArrayParam('public_anos_ativos');
  const publicCampaigns = getStringArrayParam('public_campanhas_ativas');
  const publicScopeMode = String(getParam('public_scope_mode') || 'all_active');

  const updatePublicParam = (chave: string, valor: string | number | boolean | object, descricao: string) => (
    updateParametro(chave, valor, 'publico', descricao)
  );

  const togglePublicYear = (ano: number) => {
    const next = publicYears.includes(ano)
      ? publicYears.filter(item => item !== ano)
      : [...publicYears, ano].sort((a, b) => a - b);
    updatePublicParam('public_anos_ativos', next, 'Anos eleitorais disponiveis na busca publica; vazio libera todos.');
  };

  const togglePublicCampaign = (campanhaId: string) => {
    const next = publicCampaigns.includes(campanhaId)
      ? publicCampaigns.filter(item => item !== campanhaId)
      : [...publicCampaigns, campanhaId];
    updatePublicParam('public_campanhas_ativas', next, 'Campanhas habilitadas quando o modo publico for selecionado.');
  };

  if (loading) return (
    <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">
      Carregando Configurações...
    </div>
  );

  return (
    <div className="flex flex-col gap-12 pb-32 max-w-6xl">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Configurações Globais</h2>
        <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest">Controle de comportamento, textos e parâmetros do sistema</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção: Textos */}
        <section className="bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <span className="text-xl">📝</span>
            <h3 className="text-xs font-bold uppercase tracking-widest">Rótulos das Etapas</h3>
          </div>
          <div className="grid gap-6">
            <InputConfig 
              chave="onboarding_etapa1_titulo" 
              label="Título Etapa 1 (ID)" 
              value={getParam('onboarding_etapa1_titulo') || ''} 
              onUpdate={updateParametro} 
            />
            <InputConfig 
              chave="onboarding_etapa2_titulo" 
              label="Título Etapa 2 (Perfil)" 
              value={getParam('onboarding_etapa2_titulo') || ''} 
              onUpdate={updateParametro} 
            />
          </div>
        </section>

        {/* Seção: Escopo Público */}
        <section className="bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <span className="text-xl">📅</span>
            <h3 className="text-xs font-bold uppercase tracking-widest">Escopo Público</h3>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1 block">Modo de Campanhas</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => updatePublicParam('public_scope_mode', 'all_active', 'Usar todas as campanhas ativas como escopo publico.')}
                className={`px-4 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                  publicScopeMode === 'all_active'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-dark border-border text-text-muted hover:text-white'
                }`}
              >
                Todas ativas
              </button>
              <button
                type="button"
                onClick={() => updatePublicParam('public_scope_mode', 'selected_campaigns', 'Usar apenas campanhas selecionadas como escopo publico.')}
                className={`px-4 py-3 rounded-xl border text-[9px] font-bold uppercase tracking-widest transition-all ${
                  publicScopeMode === 'selected_campaigns'
                    ? 'bg-primary border-primary text-white'
                    : 'bg-dark border-border text-text-muted hover:text-white'
                }`}
              >
                Selecionadas
              </button>
            </div>
          </div>

          <div>
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1 mb-3 block">
              Anos públicos {publicYears.length === 0 ? '(todos)' : ''}
            </label>
            <div className="flex flex-wrap gap-2">
              {[2018, 2020, 2022, 2024, 2026].map(ano => {
                const isSelected = publicYears.includes(ano);
                return (
                  <button 
                    key={ano}
                    type="button"
                    onClick={() => togglePublicYear(ano)}
                    className={`px-6 py-3 rounded-xl border text-[10px] font-bold transition-all ${isSelected ? 'bg-primary border-primary text-white' : 'bg-dark border-border text-text-muted hover:text-white'}`}
                  >
                    {ano}
                  </button>
                );
              })}
            </div>
            <p className="text-[8px] text-text-muted uppercase tracking-widest mt-3 opacity-60">
              Nenhum ano selecionado libera todos os anos de campanhas ativas.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1 block">
              Campanhas selecionadas
            </label>
            <div className="max-h-48 overflow-y-auto flex flex-col gap-2 pr-1">
              {campanhas.map((campanha) => {
                const isSelected = publicCampaigns.includes(campanha.id);
                return (
                  <button
                    key={campanha.id}
                    type="button"
                    onClick={() => togglePublicCampaign(campanha.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-white'
                        : 'bg-dark border-border text-text-muted hover:text-white'
                    }`}
                  >
                    <span className="block text-[10px] font-bold uppercase tracking-widest">{campanha.nome}</span>
                    <span className="block text-[8px] uppercase tracking-widest opacity-60 mt-1">
                      {campanha.status} · {campanha.public_scope?.candidatos_visiveis || 0} candidatos publicos
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[8px] text-text-muted uppercase tracking-widest opacity-60">
              Esta lista so restringe o publico quando o modo estiver em selecionadas.
            </p>
          </div>
        </section>

        {/* Seção: Campos Demográficos */}
        <section className="bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 lg:col-span-2">
          <div className="flex items-center gap-4">
            <span className="text-xl">👤</span>
            <h3 className="text-xs font-bold uppercase tracking-widest">Campos de Perfil Ativos</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['sexo', 'cor', 'escolaridade', 'estadoCivil', 'faixaSalarial', 'religiao', 'ocupacao', 'filhos', 'orientacaoSexual', 'deficiencia', 'tempoResidencia'].map((campo) => {
              const config = (getParam('onboarding_campos') as Record<string, boolean>) || {};
              const isActive = config[campo] !== false;
              return (
                <button 
                  key={campo}
                  onClick={() => updateParametro('onboarding_campos', { ...config, [campo]: !isActive })}
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-primary/10 border-primary text-text' : 'bg-dark border-border text-text-muted'}`}
                >
                  <span className="text-[9px] font-bold uppercase tracking-widest truncate mr-2">
                    {campo.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <div className={`w-6 h-3 rounded-full relative transition-colors ${isActive ? 'bg-primary' : 'bg-surface-2'}`}>
                    <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Seção: Parâmetros Brutos */}
        <section className="bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-8 lg:col-span-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-xl">⚙️</span>
              <h3 className="text-xs font-bold uppercase tracking-widest">Configurações Avançadas (JSON)</h3>
            </div>
            <button 
              onClick={() => setEditingParam({ chave: '', valor: '', grupo: 'geral', descricao: '' })}
              className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              + Novo Parâmetro
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-surface-2/30">
                  <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Chave</th>
                  <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Valor</th>
                  <th className="px-6 py-4 text-[9px] uppercase font-bold text-text-muted tracking-widest">Ações</th>
                </tr>
              </thead>
              <tbody>
                {parametros.map(p => (
                  <tr key={p.chave} className="border-b border-border/30 hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4 text-[10px] font-bold text-text">{p.chave}</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-primary max-w-[300px] truncate">
                      {typeof p.valor === 'object' ? JSON.stringify(p.valor) : String(p.valor)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setEditingParam({ ...p, valor: typeof p.valor === 'object' ? JSON.stringify(p.valor) : p.valor })}
                        className="text-[9px] font-bold text-text-muted hover:text-white uppercase tracking-widest"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal Edição Parâmetro */}
      {editingParam && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => setEditingParam(null)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-1 border border-border rounded-[2.5rem] p-8 shadow-2xl">
            <h2 className="text-lg font-bold font-display uppercase tracking-widest mb-8">Editar Parâmetro</h2>
            <form onSubmit={handleSaveParametro} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Chave</label>
                <input 
                  type="text" 
                  value={editingParam.chave || ''}
                  onChange={e => setEditingParam({...editingParam, chave: e.target.value})}
                  className="w-full bg-dark border border-border rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                  placeholder="Ex: geral_ano_pleito"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Valor</label>
                <textarea 
                  value={String(editingParam.valor || '')}
                  onChange={e => setEditingParam({...editingParam, valor: e.target.value})}
                  className="w-full bg-dark border border-border rounded-xl px-5 py-4 text-sm text-white outline-none focus:border-primary h-32 resize-none font-mono"
                  placeholder="Insira o valor ou JSON aqui"
                  required
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest">Salvar</button>
                <button type="button" onClick={() => setEditingParam(null)} className="px-6 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface InputConfigProps {
  chave: string;
  label: string;
  value: string | number | boolean | object;
  onUpdate: (chave: string, valor: string | number | boolean | object) => void;
}

function InputConfig({ chave, label, value, onUpdate }: InputConfigProps) {
  const [localValue, setLocalValue] = useState(String(value || ''));

  useEffect(() => {
    setLocalValue(String(value || ''));
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onBlur={() => onUpdate(chave, localValue)}
        placeholder={`Configurar ${label}`}
        className="w-full bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-text focus:border-primary outline-none transition-all"
      />
    </div>
  );
}
