'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface AuditLog {
  id: string;
  acao: string;
  entidade: string;
  entidade_id: string;
  detalhes: unknown;
  usuario_id: string | null;
  criado_em: string;
}

interface AuditResponse {
  data: AuditLog[];
  total: number;
  page: number;
  totalPages: number;
  filters?: {
    acoes: string[];
    entidades: string[];
  };
}

function formatDetails(value: unknown) {
  if (!value) return 'Sem detalhes';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

export default function AuditoriaAdminPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [acao, setAcao] = useState('');
  const [entidade, setEntidade] = useState('');
  const [search, setSearch] = useState('');
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [acoes, setAcoes] = useState<string[]>([]);
  const [entidades, setEntidades] = useState<string[]>([]);

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '50', page: String(page) });
    if (acao) params.set('acao', acao);
    if (entidade) params.set('entidade', entidade);
    if (search) params.set('search', search);
    if (inicio) params.set('inicio', inicio);
    if (fim) params.set('fim', fim);
    return params.toString();
  }, [acao, entidade, fim, inicio, page, search]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/audit-logs?${query}`);
      const json: AuditResponse = await res.json();
      setLogs(json.data || []);
      setTotal(json.total || 0);
      setTotalPages(json.totalPages || 1);
      setAcoes(json.filters?.acoes || []);
      setEntidades(json.filters?.entidades || []);
    } catch (error) {
      console.error('Erro ao carregar auditoria:', error);
      setLogs([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setAcao('');
    setEntidade('');
    setSearch('');
    setInicio('');
    setFim('');
    setPage(1);
  };

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
            Auditoria
          </h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            Trilha administrativa de exportações, dossiês, rodadas e moderação
          </p>
        </div>
        <div className="text-left lg:text-right">
          <p className="text-[9px] text-text-muted uppercase tracking-widest">Eventos encontrados</p>
          <p className="text-2xl font-bold text-primary font-display mt-1">{total}</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <input
          type="text"
          value={search}
          onChange={(event) => updateFilter(setSearch, event.target.value)}
          className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
          placeholder="Buscar ação, entidade, ID ou usuário..."
        />
        <select
          value={acao}
          onChange={(event) => updateFilter(setAcao, event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        >
          <option value="">Todas as ações</option>
          {acoes.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <select
          value={entidade}
          onChange={(event) => updateFilter(setEntidade, event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        >
          <option value="">Todas as entidades</option>
          {entidades.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <input
          type="date"
          value={inicio}
          onChange={(event) => updateFilter(setInicio, event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        />
        <input
          type="date"
          value={fim}
          onChange={(event) => updateFilter(setFim, event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        />
      </section>

      <section className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <p className="text-[10px] text-text-muted uppercase tracking-widest">
          Página {page} de {totalPages} · exibindo até 50 eventos
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={resetFilters}
            className="border border-border text-text-muted px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
          >
            Limpar filtros
          </button>
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className="border border-border text-text-muted px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:text-white disabled:opacity-30 transition-all"
          >
            Anterior
          </button>
          <button
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
            className="border border-border text-text-muted px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:text-white disabled:opacity-30 transition-all"
          >
            Próxima
          </button>
        <button
          onClick={fetchLogs}
            className="bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Atualizar
        </button>
        </div>
      </section>

      <section className="bg-surface-1 border border-border rounded-[2rem] overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-border text-[8px] text-text-muted uppercase font-bold tracking-widest">
          <span className="col-span-3">Data</span>
          <span className="col-span-2">Ação</span>
          <span className="col-span-2">Entidade</span>
          <span className="col-span-2">Usuário</span>
          <span className="col-span-3">Detalhes</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-text-muted animate-pulse uppercase tracking-widest text-[10px]">
            Carregando auditoria...
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-text-muted uppercase tracking-widest text-[10px]">
            Nenhum evento de auditoria encontrado
          </div>
        ) : (
          logs.map((log) => (
            <article
              key={log.id}
              className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-border/70 last:border-b-0 text-[11px] items-start"
            >
              <div className="col-span-3">
                <p className="text-text font-bold">{new Date(log.criado_em).toLocaleDateString('pt-BR')}</p>
                <p className="text-text-muted mt-1">{new Date(log.criado_em).toLocaleTimeString('pt-BR')}</p>
              </div>
              <p className="col-span-2 text-primary font-bold uppercase tracking-widest break-words">{log.acao}</p>
              <div className="col-span-2">
                <p className="text-text font-bold break-words">{log.entidade}</p>
                <p className="text-text-muted mt-1 break-all">{log.entidade_id}</p>
              </div>
              <p className="col-span-2 text-text-muted break-all">{log.usuario_id || 'N/A'}</p>
              <pre className="col-span-3 text-[10px] text-text-muted whitespace-pre-wrap break-words font-mono max-h-32 overflow-y-auto">
                {formatDetails(log.detalhes)}
              </pre>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
