'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Atributo {
  id: string;
  nome: string;
  descricao: string | null;
  polaridade: number;
  visivel: boolean;
  categoria: string;
}

type CategoriaTab = 'politico' | 'orgao' | 'servico';

const CATEGORIAS: { id: CategoriaTab; label: string; icon: string }[] = [
  { id: 'politico', label: 'Políticos', icon: '🏛️' },
  { id: 'orgao',    label: 'Órgãos Públicos', icon: '🏢' },
  { id: 'servico',  label: 'Serviços Públicos', icon: '🔧' },
];

const CATEGORIA_LABEL: Record<CategoriaTab, string> = {
  politico: 'Políticos',
  orgao: 'Órgãos Públicos',
  servico: 'Serviços Públicos',
};

const VAZIO: Omit<Atributo, 'id'> = { nome: '', descricao: '', polaridade: 1, visivel: true, categoria: 'politico' };

export function GestaoAtributos() {
  const [categoriaAtiva, setCategoriaAtiva] = useState<CategoriaTab>('politico');
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Partial<Atributo> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/atributos');
      setAtributos(await res.json());
    } catch { setAtributos([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const filtrados = atributos.filter(a => a.categoria === categoriaAtiva);
  const positivos = filtrados.filter(a => a.polaridade > 0);
  const negativos = filtrados.filter(a => a.polaridade < 0);

  const abrirNovo = () => setEditando({ ...VAZIO, categoria: categoriaAtiva });
  const fechar = () => { setEditando(null); setErro(null); };

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando?.nome?.trim()) return;
    setSalvando(true);
    setErro(null);

    const isEdicao = Boolean(editando.id);
    const res = await adminFetch('/api/admin/atributos', {
      method: isEdicao ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editando),
    });

    if (res.ok) {
      await carregar();
      fechar();
    } else {
      const d = await res.json().catch(() => ({}));
      setErro(d.error || 'Erro ao salvar.');
    }
    setSalvando(false);
  };

  const toggleVisivel = async (a: Atributo) => {
    await adminFetch('/api/admin/atributos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, visivel: !a.visivel }),
    });
    setAtributos(prev => prev.map(x => x.id === a.id ? { ...x, visivel: !x.visivel } : x));
  };

  const excluir = async (a: Atributo) => {
    if (!confirm(`Excluir "${a.nome}"? Esta ação é irreversível.`)) return;
    const res = await adminFetch('/api/admin/atributos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id }),
    });
    if (res.ok) {
      setAtributos(prev => prev.filter(x => x.id !== a.id));
    } else {
      const d = await res.json().catch(() => ({}));
      alert(d.error || 'Não foi possível excluir.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs de categoria */}
      <div className="flex flex-wrap gap-2 border-b border-white/5 pb-4">
        {CATEGORIAS.map(c => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoriaAtiva(c.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${categoriaAtiva === c.id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
            <span className="ml-1 text-[8px] opacity-50">({atributos.filter(a => a.categoria === c.id).length})</span>
          </button>
        ))}
        <button
          type="button"
          onClick={abrirNovo}
          className="ml-auto px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all"
        >
          + Novo atributo
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[10px]">Carregando…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ColunaPolaridade
            titulo="Positivos"
            cor="positive"
            atributos={positivos}
            onEditar={setEditando}
            onToggle={toggleVisivel}
            onExcluir={excluir}
          />
          <ColunaPolaridade
            titulo="Negativos"
            cor="negative"
            atributos={negativos}
            onEditar={setEditando}
            onToggle={toggleVisivel}
            onExcluir={excluir}
          />
        </div>
      )}

      {/* Modal */}
      {editando && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div onClick={fechar} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md bg-surface-1 border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest">{editando.id ? 'Editar Atributo' : 'Novo Atributo'}</h4>
              <button type="button" onClick={fechar} className="text-text-muted hover:text-white text-lg leading-none">×</button>
            </div>

            <form onSubmit={salvar} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Nome</label>
                <input
                  type="text"
                  value={editando.nome || ''}
                  onChange={e => setEditando({ ...editando, nome: e.target.value })}
                  placeholder="Ex: Transparência Institucional"
                  className="bg-dark border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Definição</label>
                <textarea
                  value={editando.descricao || ''}
                  onChange={e => setEditando({ ...editando, descricao: e.target.value })}
                  placeholder="Breve definição do atributo…"
                  rows={2}
                  className="bg-dark border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Polaridade</label>
                  <select
                    value={editando.polaridade ?? 1}
                    onChange={e => setEditando({ ...editando, polaridade: Number(e.target.value) })}
                    className="bg-[#1c1814] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary"
                  >
                    <option value={1}>+ Positivo</option>
                    <option value={-1}>− Negativo</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest">Categoria</label>
                  <select
                    value={editando.categoria || 'politico'}
                    onChange={e => setEditando({ ...editando, categoria: e.target.value })}
                    className="bg-[#1c1814] border border-border rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-primary"
                  >
                    <option value="politico">Políticos</option>
                    <option value="orgao">Órgãos Públicos</option>
                    <option value="servico">Serviços Públicos</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditando({ ...editando, visivel: !editando.visivel })}
                  className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${editando.visivel ? 'bg-primary' : 'bg-surface-2'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${editando.visivel ? 'right-0.5' : 'left-0.5'}`} />
                </button>
                <span className="text-[10px] text-text-muted uppercase tracking-widest">
                  {editando.visivel ? 'Visível no fluxo' : 'Oculto'}
                </span>
              </div>

              {erro && <p className="text-[10px] text-negative uppercase tracking-widest">{erro}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 bg-primary text-white py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary/80 disabled:opacity-40 transition-colors"
                >
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={fechar}
                  className="px-5 py-3 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ColunaPolaridade({
  titulo, cor, atributos, onEditar, onToggle, onExcluir
}: {
  titulo: string;
  cor: 'positive' | 'negative';
  atributos: Atributo[];
  onEditar: (a: Atributo) => void;
  onToggle: (a: Atributo) => void;
  onExcluir: (a: Atributo) => void;
}) {
  const corClass = cor === 'positive'
    ? 'bg-positive/10 border-positive/20 text-positive'
    : 'bg-negative/10 border-negative/20 text-negative';
  const dotClass = cor === 'positive' ? 'bg-positive' : 'bg-negative';

  return (
    <div className="bg-surface-1 border border-border rounded-2xl overflow-hidden">
      <div className={`px-5 py-3 border-b border-border flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{titulo}</span>
        <span className={`ml-auto text-[8px] font-bold px-2 py-0.5 rounded-full ${corClass}`}>{atributos.length}</span>
      </div>

      {atributos.length === 0 ? (
        <div className="py-10 text-center text-[10px] text-text-muted uppercase tracking-widest opacity-30">Nenhum atributo</div>
      ) : (
        <div className="divide-y divide-border/30">
          {atributos.map(a => (
            <div key={a.id} className={`px-5 py-3.5 flex items-start gap-3 transition-colors hover:bg-white/[0.01] ${!a.visivel ? 'opacity-40' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{a.nome}</p>
                {a.descricao && <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{a.descricao}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  title={a.visivel ? 'Ocultar' : 'Exibir'}
                  onClick={() => onToggle(a)}
                  className={`px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all ${a.visivel ? 'border-positive/20 text-positive/60 hover:text-positive' : 'border-white/10 text-text-muted hover:text-white'}`}
                >
                  {a.visivel ? 'Ativo' : 'Oculto'}
                </button>
                <button
                  type="button"
                  onClick={() => onEditar(a)}
                  className="px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-white/10 text-text-muted hover:text-white transition-colors"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onExcluir(a)}
                  className="px-2 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border border-negative/20 text-negative/40 hover:text-negative transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
