'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';

const MAX = 9;

interface ItemDestaque {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
}

type CategoriaDestaque = 'orgaos' | 'servicos';

interface GestaoDestaquesProps {
  categoria: CategoriaDestaque;
  buscarTodos: (query: string) => Promise<ItemDestaque[]>;
}

const CHAVE: Record<CategoriaDestaque, string> = {
  orgaos: 'destaques_orgaos',
  servicos: 'destaques_servicos',
};

const TITULO: Record<CategoriaDestaque, string> = {
  orgaos: 'Destaques — Órgãos Públicos',
  servicos: 'Destaques — Serviços Públicos',
};

const SUBTITULO: Record<CategoriaDestaque, string> = {
  orgaos: 'Até 9 órgãos aparecem como botões de seleção rápida no fluxo de avaliação.',
  servicos: 'Até 9 serviços aparecem como botões de seleção rápida no fluxo de avaliação.',
};

export function GestaoDestaques({ categoria, buscarTodos }: GestaoDestaquesProps) {
  const [destaques, setDestaques] = useState<ItemDestaque[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [queryModal, setQueryModal] = useState('');
  const [resultados, setResultados] = useState<ItemDestaque[]>([]);
  const [buscandoModal, setBuscandoModal] = useState(false);
  const chave = CHAVE[categoria];

  // Carrega os IDs salvos e resolve os objetos
  const carregar = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/configuracoes');
      const params: { chave: string; valor: unknown }[] = await res.json();
      const param = params.find(p => p.chave === chave);
      const ids = Array.isArray(param?.valor) ? (param!.valor as string[]) : [];
      if (ids.length === 0) { setDestaques([]); return; }

      // Busca os detalhes de cada ID via endpoint de busca vazia
      const todos = await buscarTodos('');
      const ordenados = ids
        .map(id => todos.find(t => t.id === id))
        .filter((x): x is ItemDestaque => Boolean(x));
      setDestaques(ordenados);
    } catch {
      setDestaques([]);
    }
  }, [chave, buscarTodos]);

  useEffect(() => { carregar(); }, [carregar]);

  const salvar = useCallback(async (lista: ItemDestaque[]) => {
    setSalvando(true);
    await adminFetch('/api/admin/configuracoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chave, valor: lista.map(d => d.id), grupo: 'destaques', descricao: TITULO[categoria] }),
    });
    setSalvando(false);
  }, [chave, categoria]);

  const adicionar = async (item: ItemDestaque) => {
    if (destaques.find(d => d.id === item.id)) return;
    if (destaques.length >= MAX) return;
    const nova = [...destaques, item];
    setDestaques(nova);
    await salvar(nova);
    setModalAberto(false);
    setQueryModal('');
    setResultados([]);
  };

  const remover = async (id: string) => {
    const nova = destaques.filter(d => d.id !== id);
    setDestaques(nova);
    await salvar(nova);
  };

  const mover = async (index: number, direcao: -1 | 1) => {
    const nova = [...destaques];
    const alvo = index + direcao;
    if (alvo < 0 || alvo >= nova.length) return;
    [nova[index], nova[alvo]] = [nova[alvo], nova[index]];
    setDestaques(nova);
    await salvar(nova);
  };

  const buscarModal = async (q: string) => {
    setBuscandoModal(true);
    const todos = await buscarTodos(q);
    setResultados(todos.filter(t => !destaques.find(d => d.id === t.id)));
    setBuscandoModal(false);
  };

  // Slots vazios para completar até 9 posições visuais
  const slots = Array.from({ length: MAX }, (_, i) => destaques[i] ?? null);

  return (
    <section className="bg-surface-1 border border-border rounded-2xl p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-2">
            <span>⭐</span> {TITULO[categoria]}
          </h3>
          <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1">{SUBTITULO[categoria]}</p>
        </div>
        <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${destaques.length >= MAX ? 'bg-negative/10 text-negative' : 'bg-white/5 text-text-muted'}`}>
          {destaques.length}/{MAX}
        </span>
      </div>

      {/* Grid de slots */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2">
        {slots.map((item, i) => (
          <div key={i} className={`relative flex flex-col items-center justify-center rounded-xl border p-2 min-h-[72px] text-center transition-all ${item ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02] border-dashed border-white/10'}`}>
            {item ? (
              <>
                <p className="text-[9px] font-bold uppercase tracking-wide text-white leading-snug line-clamp-2 w-full">{item.nome}</p>
                <p className="text-[7px] text-text-muted mt-0.5 truncate w-full">{item.cidade}</p>
                <div className="flex gap-1 mt-2">
                  <button type="button" onClick={() => mover(i, -1)} disabled={i === 0 || salvando} className="text-[9px] text-text-muted hover:text-white disabled:opacity-20 transition-colors px-1">←</button>
                  <button type="button" onClick={() => remover(item.id)} disabled={salvando} className="text-[8px] text-negative hover:opacity-70 disabled:opacity-20 transition-opacity px-1">✕</button>
                  <button type="button" onClick={() => mover(i, 1)} disabled={i === destaques.length - 1 || salvando} className="text-[9px] text-text-muted hover:text-white disabled:opacity-20 transition-colors px-1">→</button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { if (destaques.length < MAX) { setModalAberto(true); buscarModal(''); } }}
                disabled={destaques.length >= MAX}
                className="w-full h-full flex items-center justify-center text-text-muted/30 hover:text-primary/40 transition-colors disabled:cursor-not-allowed text-lg"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>

      {salvando && <p className="text-[9px] text-text-muted uppercase tracking-widest animate-pulse">Salvando…</p>}

      {/* Botão adicionar (quando ainda há espaço) */}
      {destaques.length < MAX && (
        <button
          type="button"
          onClick={() => { setModalAberto(true); buscarModal(''); }}
          className="text-[10px] uppercase font-bold tracking-widest text-primary hover:opacity-70 transition-opacity"
        >
          + Adicionar destaque
        </button>
      )}

      {/* Modal de seleção */}
      {modalAberto && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div onClick={() => { setModalAberto(false); setQueryModal(''); setResultados([]); }} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h4 className="text-xs font-bold uppercase tracking-widest">Selecionar para destaque</h4>
              <button type="button" onClick={() => { setModalAberto(false); setQueryModal(''); setResultados([]); }} className="text-text-muted hover:text-white transition-colors text-lg leading-none">×</button>
            </div>

            <div className="flex gap-2 shrink-0">
              <input
                type="text"
                value={queryModal}
                onChange={e => setQueryModal(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarModal(queryModal)}
                placeholder="Buscar por nome…"
                className="flex-1 bg-dark/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-colors"
              />
              <button type="button" onClick={() => buscarModal(queryModal)} className="px-4 py-2.5 rounded-xl bg-primary/20 text-primary text-[10px] uppercase font-bold tracking-widest hover:bg-primary/30 transition-colors">
                Buscar
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 min-h-0">
              {buscandoModal && <p className="text-[10px] text-text-muted text-center py-6 animate-pulse uppercase tracking-widest">Buscando…</p>}
              {!buscandoModal && resultados.length === 0 && (
                <p className="text-[10px] text-text-muted text-center py-6 opacity-40 uppercase tracking-widest">
                  {queryModal ? 'Sem resultados' : 'Digite para buscar ou veja todos acima'}
                </p>
              )}
              {resultados.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => adicionar(item)}
                  className="w-full flex items-center gap-3 text-left p-3 rounded-xl border border-white/5 hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white uppercase tracking-wide truncate">{item.nome}</p>
                    <p className="text-[8px] text-text-muted uppercase tracking-widest mt-0.5">{item.tipo} · {item.cidade}</p>
                  </div>
                  <span className="text-primary text-xs shrink-0">+ Adicionar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
