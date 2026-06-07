'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface ServicoPublico {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  descricao: string | null;
  foto_url: string | null;
  campanha_id: string | null;
  status: string;
  campanha?: { id: string; nome: string } | null;
}

interface Campanha {
  id: string;
  nome: string;
  status: string;
}

interface PaginatedResponse {
  data: ServicoPublico[];
  total: number;
  page: number;
  totalPages: number;
}

const TIPOS_SERVICO = [
  { value: 'upa', label: 'UPA' },
  { value: 'ubs', label: 'UBS / Posto de Saúde' },
  { value: 'hospital', label: 'Hospital Público' },
  { value: 'transporte', label: 'Transporte Público' },
  { value: 'saneamento', label: 'Saneamento / Água' },
  { value: 'energia', label: 'Energia Elétrica' },
  { value: 'escola', label: 'Escola Pública' },
  { value: 'cras', label: 'CRAS / Assistência Social' },
  { value: 'outro', label: 'Outro' },
];

const novoVazio = () => ({
  nome: '',
  tipo: '',
  cidade: '',
  uf: 'MS',
  descricao: '',
  campanha_id: '',
});

const inputClass = 'w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20';
const labelClass = 'text-[9px] uppercase font-bold text-primary tracking-widest ml-1';

export default function ManageServicos() {
  const [servicos, setServicos] = useState<ServicoPublico[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 50;

  const [editingServico, setEditingServico] = useState<Partial<ServicoPublico> | null>(null);
  const [updating, setUpdating] = useState(false);

  const [showNovo, setShowNovo] = useState(false);
  const [novoServico, setNovoServico] = useState(novoVazio());
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [criando, setCriando] = useState(false);
  const [novoErro, setNovoErro] = useState('');
  const [novoSucesso, setNovoSucesso] = useState('');

  const fetchServicos = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT), ...(searchTerm && { search: searchTerm }) });
      const res = await adminFetch(`/api/admin/servicos?${params}`);
      const result: PaginatedResponse = await res.json();
      setServicos(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch {
      setServicos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampanhas = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/campanhas?limit=50');
      const data = await res.json();
      setCampanhas(data.data || data || []);
    } catch {
      setCampanhas([]);
    }
  }, []);

  useEffect(() => { fetchServicos(page, search); }, [page, search, fetchServicos]);
  useEffect(() => { fetchCampanhas(); }, [fetchCampanhas]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingServico?.id) return;
    setUpdating(true);
    try {
      const res = await adminFetch('/api/admin/servicos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingServico),
      });
      if (res.ok) { setEditingServico(null); fetchServicos(page, search); }
    } finally {
      setUpdating(false);
    }
  };

  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    setNovoErro('');
    setNovoSucesso('');

    if (!novoServico.nome.trim() || !novoServico.tipo || !novoServico.cidade.trim()) {
      setNovoErro('Campos obrigatórios: nome, tipo, cidade');
      return;
    }

    setCriando(true);
    try {
      const res = await adminFetch('/api/admin/servicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoServico),
      });

      if (!res.ok) {
        const data = await res.json();
        setNovoErro(data.error || 'Erro ao criar serviço.');
        return;
      }

      setNovoSucesso('Serviço cadastrado com sucesso!');
      setNovoServico(novoVazio());
      fetchServicos(page, search);
    } finally {
      setCriando(false);
    }
  };

  const handleToggleStatus = async (svc: ServicoPublico) => {
    const novoStatus = svc.status === 'Ativo' ? 'Inativo' : 'Ativo';
    await adminFetch('/api/admin/servicos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: svc.id, status: novoStatus }),
    });
    fetchServicos(page, search);
  };

  const tipoLabel = (tipo: string) => TIPOS_SERVICO.find(t => t.value === tipo)?.label ?? tipo;

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Serviços Públicos</h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            {total > 0 ? `${total.toLocaleString('pt-BR')} serviço(s) cadastrado(s) — Página ${page}/${totalPages}` : 'Carregando...'}
          </p>
        </div>

        <div className="w-full md:w-auto flex gap-3">
          <form onSubmit={handleSearch} className="flex gap-3 flex-1 md:flex-none">
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="flex-1 md:w-64 bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white transition-all placeholder:text-white/20"
              placeholder="Nome, tipo ou cidade..."
            />
            <button type="submit" className="bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">🔍</button>
          </form>
          <button
            type="button"
            onClick={() => { setShowNovo(true); setNovoErro(''); setNovoSucesso(''); setNovoServico(novoVazio()); }}
            className="bg-primary/20 border border-primary/40 text-primary px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white active:scale-95 transition-all whitespace-nowrap"
          >
            + Novo
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nome</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Tipo</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cidade</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Campanha</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {servicos.map(svc => (
              <tr key={svc.id} className={`border-b border-border/30 hover:bg-white/[0.01] transition-colors group ${svc.status === 'Inativo' ? 'opacity-40' : ''}`}>
                <td className="px-8 py-5 text-xs font-bold text-text">{svc.nome}</td>
                <td className="px-8 py-5 text-[10px] font-bold text-[#d97757]">{tipoLabel(svc.tipo)}</td>
                <td className="px-8 py-5 text-[10px] text-text-muted">{svc.cidade} · {svc.uf}</td>
                <td className="px-8 py-5 text-[10px] text-text-muted truncate max-w-[160px]">{svc.campanha?.nome ?? '—'}</td>
                <td className="px-8 py-5">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(svc)}
                    className={`text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full transition-all ${svc.status === 'Ativo' ? 'bg-positive/10 text-positive hover:bg-negative/10 hover:text-negative' : 'bg-white/5 text-text-muted hover:bg-positive/10 hover:text-positive'}`}
                  >
                    {svc.status}
                  </button>
                </td>
                <td className="px-8 py-5 text-right">
                  <button type="button" onClick={() => setEditingServico(svc)} className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">Sincronizando...</div>}
        {!loading && servicos.length === 0 && (
          <div className="p-20 text-center text-text-muted uppercase tracking-widest text-[10px]">
            Nenhum serviço encontrado{search ? ` para "${search}"` : ''}
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-4">
        {servicos.map(svc => (
          <div key={svc.id} className="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">{svc.nome}</p>
                <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] mt-1">{tipoLabel(svc.tipo)} · {svc.cidade}</p>
              </div>
              <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${svc.status === 'Ativo' ? 'bg-positive/10 text-positive' : 'bg-white/5 text-text-muted'}`}>{svc.status}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <span className="text-[10px] text-text-muted">{svc.campanha?.nome ?? '—'}</span>
              <button type="button" onClick={() => setEditingServico(svc)} className="text-[10px] font-bold text-primary uppercase tracking-widest">Editar</button>
            </div>
          </div>
        ))}
        {loading && <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">Carregando...</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all">← Anterior</button>
          <span className="text-[10px] font-mono text-text-muted tracking-widest">{page} / {totalPages}</span>
          <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all">Próximo →</button>
        </div>
      )}

      {/* Modal — Novo Serviço */}
      {showNovo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setShowNovo(false)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl my-8">
            <h3 className="text-xl font-bold font-display uppercase tracking-widest mb-2">Novo Serviço Público</h3>
            <p className="text-[9px] text-text-muted uppercase tracking-widest mb-8">
              Cadastre UPAs, UBSs, hospitais, transporte público, concessionárias e outros serviços.
            </p>

            <form onSubmit={handleCriar} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Nome do Serviço *</label>
                  <input type="text" value={novoServico.nome} onChange={e => setNovoServico({ ...novoServico, nome: e.target.value })} className={inputClass} placeholder="Ex: UPA Norte – Campo Grande" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tipo *</label>
                  <select value={novoServico.tipo} onChange={e => setNovoServico({ ...novoServico, tipo: e.target.value })} className={inputClass} required>
                    <option value="">Selecione o tipo...</option>
                    {TIPOS_SERVICO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Cidade *</label>
                  <input type="text" value={novoServico.cidade} onChange={e => setNovoServico({ ...novoServico, cidade: e.target.value })} className={inputClass} placeholder="Ex: Campo Grande" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>UF</label>
                  <input type="text" value={novoServico.uf} onChange={e => setNovoServico({ ...novoServico, uf: e.target.value.toUpperCase().slice(0, 2) })} className={inputClass} placeholder="MS" maxLength={2} />
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Campanha (Atributos)</label>
                  <select value={novoServico.campanha_id} onChange={e => setNovoServico({ ...novoServico, campanha_id: e.target.value })} className={inputClass}>
                    <option value="">Sem campanha vinculada</option>
                    {campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Descrição</label>
                  <textarea value={novoServico.descricao} onChange={e => setNovoServico({ ...novoServico, descricao: e.target.value })} className={`${inputClass} resize-none`} rows={2} placeholder="Breve descrição opcional" />
                </div>
              </div>

              {novoErro && <p className="text-[10px] text-negative font-bold uppercase tracking-widest">{novoErro}</p>}
              {novoSucesso && <p className="text-[10px] text-positive font-bold uppercase tracking-widest">{novoSucesso}</p>}

              <div className="flex gap-4 mt-2">
                <button type="submit" disabled={criando} className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                  {criando ? 'Cadastrando...' : 'Cadastrar Serviço'}
                </button>
                <button type="button" onClick={() => setShowNovo(false)} className="px-8 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Editar Serviço */}
      {editingServico && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => setEditingServico(null)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            <h3 className="text-xl font-bold font-display uppercase tracking-widest mb-8">Editar Serviço</h3>
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Nome</label>
                  <input type="text" value={editingServico.nome || ''} onChange={e => setEditingServico({ ...editingServico, nome: e.target.value })} className={inputClass} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Tipo</label>
                  <select value={editingServico.tipo || ''} onChange={e => setEditingServico({ ...editingServico, tipo: e.target.value })} className={inputClass}>
                    {TIPOS_SERVICO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Cidade</label>
                  <input type="text" value={editingServico.cidade || ''} onChange={e => setEditingServico({ ...editingServico, cidade: e.target.value })} className={inputClass} required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Campanha</label>
                  <select value={editingServico.campanha_id || ''} onChange={e => setEditingServico({ ...editingServico, campanha_id: e.target.value || null })} className={inputClass}>
                    <option value="">Sem campanha</option>
                    {campanhas.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="submit" disabled={updating} className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button type="button" onClick={() => setEditingServico(null)} className="px-8 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
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
