'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Candidato {
  id: string;
  nome: string;
  partido: string | null;
  numero: string | null;
  cargo: string;
  cidade: string;
  ano_eleicao: number;
  status: string;
  campanha?: {
    nome: string;
  };
}

interface PaginatedResponse {
  data: Candidato[];
  total: number;
  page: number;
  totalPages: number;
}

export default function ManageCandidatos() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 50;

  const fetchCandidatos = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNum),
        limit: String(LIMIT),
        ...(searchTerm && { search: searchTerm }),
      });
      const res = await adminFetch(`/api/admin/candidatos?${params}`);
      const result: PaginatedResponse = await res.json();
      setCandidatos(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setCandidatos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidatos(page, search);
  }, [page, search, fetchCandidatos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const [editingCandidato, setEditingCandidato] = useState<Partial<Candidato> | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidato?.id) return;
    setUpdating(true);
    try {
      const res = await adminFetch('/api/admin/candidatos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCandidato),
      });
      if (res.ok) {
        setEditingCandidato(null);
        fetchCandidatos(page, search);
      }
    } catch (error) {
      console.error('Erro ao atualizar candidato:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Gestão de Candidatos</h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            {total > 0 ? `${total.toLocaleString('pt-BR')} candidatos no escopo público — Página ${page}/${totalPages}` : 'Carregando...'}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="w-full md:w-auto flex gap-3">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 md:w-64 bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white transition-all placeholder:text-white/20"
            placeholder="Nome, cargo, partido ou cidade..."
          />
          <button 
            type="submit"
            className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
          >
            🔍
          </button>
        </form>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nome</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Partido</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Número</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cargo</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ano</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cidade</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map(cand => (
              <tr key={cand.id} className={`border-b border-border/30 hover:bg-white/[0.01] transition-colors group ${cand.status === 'Inativo' ? 'opacity-40' : ''}`}>
                <td className="px-8 py-5 text-xs font-bold text-text">{cand.nome}</td>
                <td className="px-8 py-5 text-[10px] font-bold text-[#d97757]">{cand.partido || '-'}</td>
                <td className="px-8 py-5 text-[10px] font-mono text-text-muted">{cand.numero || '-'}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-text-muted">{cand.cargo}</td>
                <td className="px-8 py-5 text-[10px] font-mono text-text-muted">{cand.ano_eleicao}</td>
                <td className="px-8 py-5 text-[10px] text-text-muted truncate max-w-[140px]">{cand.cidade}</td>
                <td className="px-8 py-5">
                   <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${cand.status === 'Ativo' ? 'bg-positive/10 text-positive' : 'bg-white/5 text-text-muted'}`}>
                      {cand.status}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                  <button 
                    onClick={() => setEditingCandidato(cand)}
                    className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">Sincronizando Candidatos...</div>}
        {!loading && candidatos.length === 0 && (
          <div className="p-20 text-center text-text-muted uppercase tracking-widest text-[10px]">
            Nenhum candidato encontrado{search ? ` para "${search}"` : ''}
          </div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-4">
        {candidatos.map(cand => (
          <div key={cand.id} className="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-4">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-xs font-bold uppercase tracking-widest">{cand.nome}</p>
                   <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] mt-1">{cand.cargo} • {cand.cidade}</p>
                </div>
                <span className="bg-primary/10 text-primary text-[10px] font-mono px-3 py-1 rounded-full font-bold">
                   {cand.numero || '--'}
                </span>
             </div>
             <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <span className="text-[10px] font-bold text-[#d97757] uppercase tracking-widest">{cand.partido || 'Sem Partido'}</span>
                <button 
                  onClick={() => setEditingCandidato(cand)}
                  className="text-[10px] font-bold text-primary uppercase tracking-widest"
                >
                  Editar
                </button>
             </div>
          </div>
        ))}
        {loading && <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">Carregando...</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            ← Anterior
          </button>
          <span className="text-[10px] font-mono text-text-muted tracking-widest">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            Próximo →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingCandidato && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            onClick={() => setEditingCandidato(null)}
            className="absolute inset-0 bg-dark/80 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-lg bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            <h3 className="text-xl font-bold font-display uppercase tracking-widest mb-8">Editar Candidato</h3>
            
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={editingCandidato.nome || ''}
                    onChange={e => setEditingCandidato({...editingCandidato, nome: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all"
                    placeholder="Nome Completo do Candidato"
                    required
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Partido</label>
                  <input 
                    type="text" 
                    value={editingCandidato.partido || ''}
                    onChange={e => setEditingCandidato({...editingCandidato, partido: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all"
                    placeholder="Ex: PT, PL, PSDB..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Número</label>
                  <input 
                    type="text" 
                    value={editingCandidato.numero || ''}
                    onChange={e => setEditingCandidato({...editingCandidato, numero: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all"
                    placeholder="Ex: 13, 22, 45..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Cargo</label>
                  <input 
                    type="text" 
                    value={editingCandidato.cargo || ''}
                    onChange={e => setEditingCandidato({...editingCandidato, cargo: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all"
                    placeholder="Ex: Governador, Deputado..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-1">Cidade</label>
                  <input 
                    type="text" 
                    value={editingCandidato.cidade || ''}
                    onChange={e => setEditingCandidato({...editingCandidato, cidade: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all"
                    placeholder="Ex: Campo Grande, Dourados..."
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button 
                  type="submit"
                  disabled={updating}
                  className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingCandidato(null)}
                  className="px-8 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
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
