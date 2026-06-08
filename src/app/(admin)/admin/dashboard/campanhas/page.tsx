'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Campanha {
  id: string;
  nome: string;
  slug: string;
  status: string;
  total_votos: number;
  media_consolidada: number;
  data_inicio: string;
  data_fim: string | null;
  _count: {
    candidatos: number;
    atributos: number;
  };
  public_scope?: {
    visivel: boolean;
    candidatos_visiveis: number;
    modo: 'all_active' | 'selected_campaigns';
    anos_ativos: number[];
    selecionada: boolean;
  };
}

interface PaginatedResponse {
  data: Campanha[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ativo: { label: 'Ativa', color: 'text-positive', bg: 'bg-positive/10' },
  pausado: { label: 'Pausada', color: 'text-[#c8933a]', bg: 'bg-[#c8933a]/10' },
  encerrado: { label: 'Encerrada', color: 'text-negative', bg: 'bg-negative/10' },
};

interface ConfirmModal {
  tipo: 'arquivar' | 'excluir';
  campanha: Campanha;
}

export default function ManageCampanhas() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCampanha, setNewCampanha] = useState({ nome: '', slug: '' });
  const [toggling, setToggling] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmModal | null>(null);
  const [actioning, setActioning] = useState(false);
  const LIMIT = 20;

  const fetchCampanhas = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await adminFetch(`/api/admin/campanhas?${params}`);
      const result: PaginatedResponse = await res.json();
      setCampanhas(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Erro ao buscar campanhas:', error);
      setCampanhas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampanhas(page, search);
  }, [page, search, fetchCampanhas]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampanha.nome || !newCampanha.slug) return;
    setCreating(true);
    try {
      const res = await adminFetch('/api/admin/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCampanha),
      });
      if (res.ok) {
        setNewCampanha({ nome: '', slug: '' });
        setShowCreate(false);
        fetchCampanhas(1, search);
        setPage(1);
      }
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (campanha: Campanha) => {
    const nextStatus = campanha.status === 'ativo' ? 'pausado' : 'ativo';
    setToggling(campanha.id);
    try {
      const res = await adminFetch('/api/admin/campanhas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campanha.id, status: nextStatus }),
      });
      if (res.ok) {
        fetchCampanhas(page, search);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    } finally {
      setToggling(null);
    }
  };

  const arquivarCiclo = async (campanha: Campanha) => {
    setActioning(true);
    try {
      const res = await adminFetch('/api/admin/campanhas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campanha.id, status: 'encerrado' }),
      });
      if (res.ok) { setConfirm(null); fetchCampanhas(page, search); }
    } catch (error) {
      console.error('Erro ao arquivar:', error);
    } finally {
      setActioning(false);
    }
  };

  const excluirCiclo = async (campanha: Campanha) => {
    setActioning(true);
    try {
      const res = await adminFetch('/api/admin/campanhas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campanha.id }),
      });
      if (res.ok) {
        setConfirm(null);
        fetchCampanhas(1, search);
        setPage(1);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Erro ao excluir ciclo.');
        setConfirm(null);
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
    } finally {
      setActioning(false);
    }
  };

  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
            Gestão de Ciclos
          </h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            {total > 0
              ? `${total} ciclo${total > 1 ? 's' : ''} cadastrado${total > 1 ? 's' : ''} — Página ${page}/${totalPages}`
              : 'Carregando...'}
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-3 flex-1 md:flex-none">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 md:w-52 bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white transition-all placeholder:text-white/20"
              placeholder="Buscar ciclo..."
            />
            <button
              type="submit"
              className="bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
            >
              🔍
            </button>
          </form>

          {/* Create Button */}
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-positive/10 border border-positive/20 text-positive px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-positive/20 active:scale-95 transition-all whitespace-nowrap"
          >
            {showCreate ? '✕ Fechar' : '+ Nova'}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-300"
        >
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Novo Ciclo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-text-muted opacity-60">
                Nome do Ciclo
              </label>
              <input
                type="text"
                value={newCampanha.nome}
                onChange={(e) => {
                  const nome = e.target.value;
                  setNewCampanha({ nome, slug: generateSlug(nome) });
                }}
                className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-4 text-xs text-white transition-all placeholder:text-white/20"
                placeholder="Ex: Eleições MS 2026"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase font-bold tracking-widest text-text-muted opacity-60">
                Slug (gerado automaticamente)
              </label>
              <input
                type="text"
                value={newCampanha.slug}
                onChange={(e) =>
                  setNewCampanha((prev) => ({ ...prev, slug: e.target.value }))
                }
                className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-4 text-xs text-white font-mono transition-all placeholder:text-white/20"
                placeholder="eleicoes-municipais-2024"
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="bg-primary text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {creating ? 'Criando...' : 'Criar Ciclo'}
            </button>
          </div>
        </form>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[11%]" />
            <col className="w-[10%]" />
            <col className="w-[11%]" />
            <col className="w-[9%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[17%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nome</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Slug</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest text-center">Políticos</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest text-center">Atribs</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest text-center">Votos</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Início</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((camp) => {
              const statusInfo = STATUS_MAP[camp.status] || STATUS_MAP['ativo'];
              return (
                <tr
                  key={camp.id}
                  className="border-b border-border/30 hover:bg-white/[0.01] transition-colors group"
                >
                  <td className="px-4 py-4 text-xs font-bold text-text truncate">{camp.nome}</td>
                  <td className="px-3 py-4 text-[10px] font-mono text-text-muted opacity-60 truncate">{camp.slug}</td>
                  <td className="px-3 py-4">
                    <span className={`inline-block px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${statusInfo.color} ${statusInfo.bg}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-mono text-text-muted text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{camp._count.candidatos}</span>
                      <span className={camp.public_scope?.visivel ? 'text-positive text-[8px]' : 'text-text-muted/50 text-[8px]'}>
                        {camp.public_scope?.candidatos_visiveis || 0} pub.
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-[11px] font-mono text-text-muted text-center">{camp._count.atributos}</td>
                  <td className="px-3 py-4 text-[11px] font-mono text-primary text-center font-bold">
                    {camp.total_votos.toLocaleString('pt-BR')}
                  </td>
                  <td className="px-3 py-4 text-[10px] font-mono text-text-muted opacity-60">
                    {new Date(camp.data_inicio).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1.5 items-start">
                      <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        camp.public_scope?.visivel ? 'text-positive bg-positive/10' : 'text-text-muted bg-white/5'
                      }`}>
                        {camp.public_scope?.visivel ? 'Pública' : 'Privada'}
                      </span>
                      {camp.status !== 'encerrado' && (
                        <button
                          type="button"
                          onClick={() => toggleStatus(camp)}
                          disabled={toggling === camp.id}
                          className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border transition-all hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                            camp.status === 'ativo'
                              ? 'text-[#c8933a] border-[#c8933a]/20 bg-[#c8933a]/5 hover:bg-[#c8933a]/10'
                              : 'text-positive border-positive/20 bg-positive/5 hover:bg-positive/10'
                          }`}
                        >
                          {toggling === camp.id ? '…' : camp.status === 'ativo' ? 'Pausar' : 'Ativar'}
                        </button>
                      )}
                      {camp.status !== 'encerrado' && (
                        <button
                          type="button"
                          onClick={() => setConfirm({ tipo: 'arquivar', campanha: camp })}
                          className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-negative/20 bg-negative/5 text-negative hover:bg-negative/10 transition-all active:scale-95"
                        >
                          Encerrar
                        </button>
                      )}
                      {camp.status === 'encerrado' && camp.total_votos === 0 && camp._count.candidatos === 0 && (
                        <button
                          type="button"
                          onClick={() => setConfirm({ tipo: 'excluir', campanha: camp })}
                          className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-negative/40 bg-negative/10 text-negative hover:bg-negative/20 transition-all active:scale-95"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">
            Sincronizando Ciclos...
          </div>
        )}
        {!loading && campanhas.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center gap-4">
            <span className="text-4xl opacity-20">📢</span>
            <p className="text-text-muted uppercase tracking-widest text-[10px]">
              Nenhum ciclo encontrado
              {search ? ` para "${search}"` : ''}
            </p>
            {!search && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 bg-primary/10 border border-primary/20 text-primary px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
              >
                + Criar Primeiro Ciclo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-4">
        {campanhas.map((camp) => {
          const statusInfo = STATUS_MAP[camp.status] || STATUS_MAP['ativo'];
          return (
            <div
              key={camp.id}
              className="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-5"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest truncate">
                    {camp.nome}
                  </p>
                  <p className="text-[8px] text-text-muted font-mono uppercase tracking-[0.2em] mt-1 opacity-50">
                    /{camp.slug}
                  </p>
                </div>
                <span
                  className={`shrink-0 ml-3 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${statusInfo.color} ${statusInfo.bg}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/[0.02] rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-text-muted uppercase tracking-widest opacity-50">
                    Políticos
                  </p>
                  <p className="text-sm font-bold font-mono text-text mt-1">
                    {camp._count.candidatos}
                  </p>
                  <p className="text-[7px] uppercase tracking-widest text-text-muted mt-1">
                    {camp.public_scope?.candidatos_visiveis || 0} públicos
                  </p>
                </div>
                <div className="bg-white/[0.02] rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-text-muted uppercase tracking-widest opacity-50">
                    Atributos
                  </p>
                  <p className="text-sm font-bold font-mono text-text mt-1">
                    {camp._count.atributos}
                  </p>
                </div>
                <div className="bg-primary/5 rounded-2xl p-3 text-center">
                  <p className="text-[8px] text-primary uppercase tracking-widest opacity-70">
                    Votos
                  </p>
                  <p className="text-sm font-bold font-mono text-primary mt-1">
                    {camp.total_votos.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-between items-center gap-2 pt-4 border-t border-border/50">
                <span className="text-[8px] font-mono text-text-muted opacity-50">
                  {camp.public_scope?.visivel ? 'Publica ao usuario' : 'Fora do escopo publico'}
                </span>
                <div className="flex gap-2 flex-wrap justify-end">
                  {camp.status !== 'encerrado' && (
                    <button
                      type="button"
                      onClick={() => toggleStatus(camp)}
                      disabled={toggling === camp.id}
                      className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all active:scale-95 disabled:opacity-30 ${
                        camp.status === 'ativo'
                          ? 'text-[#c8933a] border-[#c8933a]/20 bg-[#c8933a]/5'
                          : 'text-positive border-positive/20 bg-positive/5'
                      }`}
                    >
                      {toggling === camp.id ? '...' : camp.status === 'ativo' ? 'Pausar' : 'Ativar'}
                    </button>
                  )}
                  {camp.status !== 'encerrado' && (
                    <button
                      type="button"
                      onClick={() => setConfirm({ tipo: 'arquivar', campanha: camp })}
                      className="text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-negative/20 bg-negative/5 text-negative transition-all active:scale-95"
                    >
                      Encerrar
                    </button>
                  )}
                  {camp.status === 'encerrado' && camp.total_votos === 0 && camp._count.candidatos === 0 && (
                    <button
                      type="button"
                      onClick={() => setConfirm({ tipo: 'excluir', campanha: camp })}
                      className="text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-negative/40 bg-negative/10 text-negative transition-all active:scale-95"
                    >
                      Excluir
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">
            Carregando...
          </div>
        )}
        {!loading && campanhas.length === 0 && (
          <div className="py-16 text-center flex flex-col items-center gap-4">
            <span className="text-4xl opacity-20">📢</span>
            <p className="text-text-muted uppercase tracking-widest text-[9px]">
              Nenhum ciclo cadastrado
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 bg-primary/10 border border-primary/20 text-primary px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              + Criar Primeiro Ciclo
            </button>
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {confirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !actioning && setConfirm(null)} />
          <div className="relative w-full max-w-sm bg-surface-1 border border-border rounded-[2.5rem] p-8 shadow-2xl flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-2xl">{confirm.tipo === 'excluir' ? '🗑️' : '🔒'}</span>
              <h3 className="text-sm font-bold font-display uppercase tracking-widest text-text">
                {confirm.tipo === 'excluir' ? 'Excluir ciclo' : 'Encerrar ciclo'}
              </h3>
              <p className="text-[11px] text-text-muted leading-relaxed">
                {confirm.tipo === 'excluir'
                  ? <>Tem certeza que deseja <span className="text-negative font-bold">excluir permanentemente</span> o ciclo <span className="text-text font-bold">"{confirm.campanha.nome}"</span>? Esta ação não pode ser desfeita.</>
                  : <>O ciclo <span className="text-text font-bold">"{confirm.campanha.nome}"</span> será marcado como <span className="text-negative font-bold">Encerrado</span> e removido do escopo público. Os dados são preservados.</>
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => confirm.tipo === 'excluir' ? excluirCiclo(confirm.campanha) : arquivarCiclo(confirm.campanha)}
                disabled={actioning}
                className="flex-1 bg-negative/10 border border-negative/30 text-negative py-3 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-negative/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actioning ? 'Aguarde…' : confirm.tipo === 'excluir' ? 'Sim, excluir' : 'Sim, encerrar'}
              </button>
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={actioning}
                className="px-5 py-3 border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>
          <span className="text-[10px] font-mono text-text-muted tracking-widest">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
