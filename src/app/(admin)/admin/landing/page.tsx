'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Campo {
  chave: string;
  label: string;
  descricao: string;
  tipo: 'text' | 'textarea';
  padrao: string;
}

const CAMPOS: Campo[] = [
  {
    chave: 'landing_titulo_linha1',
    label: 'Título — Linha 1',
    descricao: 'Primeira linha do título principal (texto branco)',
    tipo: 'text',
    padrao: 'Não é uma pesquisa.',
  },
  {
    chave: 'landing_titulo_linha2',
    label: 'Título — Linha 2',
    descricao: 'Segunda linha do título (texto laranja em gradiente)',
    tipo: 'text',
    padrao: 'É o futuro de MS.',
  },
  {
    chave: 'landing_subtitulo',
    label: 'Subtítulo / Descrição',
    descricao: 'Parágrafo explicativo abaixo do título',
    tipo: 'textarea',
    padrao: 'PULSOMS.IA é a plataforma de inteligência e percepção pública de Mato Grosso do Sul. Avalie políticos, órgãos e serviços públicos — sua voz conta.',
  },
  {
    chave: 'landing_cta_principal',
    label: 'Botão Principal',
    descricao: 'Texto do botão laranja (link para /avaliar)',
    tipo: 'text',
    padrao: 'Expressar Minha Visão',
  },
  {
    chave: 'landing_cta_secundario',
    label: 'Botão Secundário',
    descricao: 'Texto do botão escuro (link para /admin/dashboard)',
    tipo: 'text',
    padrao: 'Acesso Restrito',
  },
  {
    chave: 'landing_passo_1',
    label: 'Como Funciona — Passo 1',
    descricao: 'Primeiro passo exibido com ícone 📍 (ex: Informe sua região)',
    tipo: 'text',
    padrao: 'Informe sua região',
  },
  {
    chave: 'landing_passo_2',
    label: 'Como Funciona — Passo 2',
    descricao: 'Segundo passo exibido com ícone 👤 (ex: Escolha o que avaliar)',
    tipo: 'text',
    padrao: 'Escolha o que avaliar',
  },
  {
    chave: 'landing_passo_3',
    label: 'Como Funciona — Passo 3',
    descricao: 'Terceiro passo exibido com ícone ✅ (ex: Dê sua opinião)',
    tipo: 'text',
    padrao: 'Dê sua opinião',
  },
  {
    chave: 'landing_reforco',
    label: 'Frase de Reforço',
    descricao: 'Texto pequeno abaixo dos 3 passos (ex: Leva menos de 2 minutos...)',
    tipo: 'text',
    padrao: 'Leva menos de 2 minutos. Sem cadastro, sem identificação.',
  },
];

export default function LandingConfigPage() {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fetchParametros = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/configuracoes');
      const data: { chave: string; valor: string }[] = await res.json();
      const map: Record<string, string> = {};
      for (const p of data) {
        if (p.chave.startsWith('landing_')) map[p.chave] = String(p.valor);
      }
      // preenche defaults para campos ainda não salvos
      for (const c of CAMPOS) {
        if (!(c.chave in map)) map[c.chave] = c.padrao;
      }
      setValores(map);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => { fetchParametros(); }, [fetchParametros]);

  const salvar = async (campo: Campo) => {
    setSalvando(campo.chave);
    setErro(null);
    setSucesso(null);
    try {
      const res = await adminFetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chave: campo.chave,
          valor: valores[campo.chave] ?? campo.padrao,
          grupo: 'landing',
          descricao: campo.descricao,
        }),
      });
      if (res.ok) {
        setSucesso(campo.chave);
        setTimeout(() => setSucesso(null), 2500);
      } else {
        setErro(campo.chave);
      }
    } catch {
      setErro(campo.chave);
    } finally {
      setSalvando(null);
    }
  };

  const restaurar = (campo: Campo) => {
    setValores(prev => ({ ...prev, [campo.chave]: campo.padrao }));
  };

  const inputClass = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20 resize-none';

  return (
    <div className="flex flex-col gap-10 max-w-3xl">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
          Landing Page
        </h2>
        <p className="text-[11px] text-text-muted uppercase mt-3 tracking-widest">
          Textos exibidos na página inicial pública — alterações entram em vigor imediatamente
        </p>
      </div>

      {/* Preview card */}
      <div className="bg-[#141413] border border-[#3d3128] rounded-3xl p-6 flex flex-col gap-2">
        <p className="text-[8px] uppercase tracking-widest text-text-muted font-bold mb-2 opacity-50">Pré-visualização</p>
        <p className="text-2xl sm:text-3xl font-bold text-[#f5f0e8] leading-tight">
          {valores.landing_titulo_linha1 || CAMPOS[0].padrao}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d97757] via-[#c8933a] to-[#d97757] leading-tight">
          {valores.landing_titulo_linha2 || CAMPOS[1].padrao}
        </p>
        <p className="text-[11px] text-[#b0aea5] mt-2 leading-relaxed">
          {valores.landing_subtitulo || CAMPOS[2].padrao}
        </p>
        <div className="flex items-center gap-2 mt-4">
          {[
            { icone: '📍', chave: 'landing_passo_1', idx: 5 },
            { icone: '👤', chave: 'landing_passo_2', idx: 6 },
            { icone: '✅', chave: 'landing_passo_3', idx: 7 },
          ].map((p, i) => (
            <React.Fragment key={p.chave}>
              <div className="flex flex-col items-center gap-1 flex-1">
                <span className="text-base">{p.icone}</span>
                <span className="text-[8px] text-[#b0aea5] uppercase tracking-wider font-bold text-center leading-tight">
                  {valores[p.chave] || CAMPOS[p.idx].padrao}
                </span>
              </div>
              {i < 2 && <span className="text-[#3d3128] text-sm shrink-0">→</span>}
            </React.Fragment>
          ))}
        </div>
        <p className="text-[10px] text-[#7a6e64] mt-2">
          {valores.landing_reforco || CAMPOS[8].padrao}
        </p>
        <div className="flex gap-3 mt-3 flex-wrap">
          <span className="px-5 py-2 rounded-full bg-[#d97757] text-[#f5f0e8] text-[10px] font-bold uppercase tracking-widest">
            {valores.landing_cta_principal || CAMPOS[3].padrao}
          </span>
          <span className="px-5 py-2 rounded-full border border-[#3d3128] text-[#f5f0e8] text-[10px] font-bold uppercase tracking-widest">
            {valores.landing_cta_secundario || CAMPOS[4].padrao}
          </span>
        </div>
      </div>

      {/* Campos */}
      <div className="flex flex-col gap-6">
        {CAMPOS.map(campo => (
          <div key={campo.chave} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{campo.label}</p>
              <p className="text-[10px] text-text-muted mt-1">{campo.descricao}</p>
            </div>

            {campo.tipo === 'textarea' ? (
              <textarea
                rows={3}
                value={valores[campo.chave] ?? campo.padrao}
                onChange={e => setValores(prev => ({ ...prev, [campo.chave]: e.target.value }))}
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                value={valores[campo.chave] ?? campo.padrao}
                onChange={e => setValores(prev => ({ ...prev, [campo.chave]: e.target.value }))}
                className={inputClass}
              />
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => salvar(campo)}
                disabled={salvando === campo.chave}
                className="px-6 py-2.5 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {salvando === campo.chave ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => restaurar(campo)}
                className="px-6 py-2.5 border border-white/10 text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Restaurar padrão
              </button>
              {sucesso === campo.chave && (
                <span className="text-[10px] text-positive font-bold uppercase tracking-widest">✓ Salvo</span>
              )}
              {erro === campo.chave && (
                <span className="text-[10px] text-negative font-bold uppercase tracking-widest">Erro ao salvar</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
