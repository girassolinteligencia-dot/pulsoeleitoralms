'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface LocalidadeOption {
  bairro: string;
  registros: number;
  proporcao: number;
}

interface CepMs {
  cep: string;
  cidade: string;
  bairro: string | null;
  origem: string;
  localidades: LocalidadeOption[] | null;
  bairro_confianca: number | null;
  total_registros: number;
  localidades_count: number;
  logradouros_count: number;
  importado_em: string | null;
}

interface CepResponse {
  data: CepMs[];
  total: number;
  page: number;
  totalPages: number;
  summary: {
    total: number;
    ambiguos: number;
    baixaConfianca: number;
    revisados: number;
    confiancaMedia: number;
    importadoEm: string | null;
  };
}

const LIMIT = 50;

function formatPct(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function TerritorioAdminPage() {
  const [items, setItems] = useState<CepMs[]>([]);
  const [summary, setSummary] = useState<CepResponse['summary'] | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('baixa-confianca');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingCep, setSavingCep] = useState<string | null>(null);

  const fetchCeps = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status,
        ...(search && { search }),
      });
      const res = await adminFetch(`/api/admin/ceps?${params.toString()}`);
      const data = await res.json() as CepResponse;
      setItems(data.data || []);
      setSummary(data.summary || null);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Erro ao carregar CEPs:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    fetchCeps();
  }, [fetchCeps]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const reviseCep = async (cep: string, bairro: string) => {
    setSavingCep(cep);
    try {
      const res = await adminFetch('/api/admin/ceps', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep, bairro }),
      });
      if (!res.ok) throw new Error('Falha ao revisar CEP');
      await fetchCeps();
    } catch (error) {
      console.error('Erro ao revisar CEP:', error);
      alert('Não foi possível revisar este CEP.');
    } finally {
      setSavingCep(null);
    }
  };

  const summaryCards = [
    { label: 'CEPs MS', value: summary?.total.toLocaleString('pt-BR') || '-' },
    { label: 'Ambíguos', value: summary?.ambiguos.toLocaleString('pt-BR') || '-' },
    { label: 'Baixa confiança', value: summary?.baixaConfianca.toLocaleString('pt-BR') || '-' },
    { label: 'Revisados', value: summary?.revisados.toLocaleString('pt-BR') || '-' },
  ];

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col gap-3">
        <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
          Território e CEPs
        </h2>
        <p className="max-w-3xl text-[10px] text-text-muted uppercase tracking-widest leading-relaxed">
          Curadoria da base IBGE agregada por CEP. Use esta tela para revisar bairros ambíguos antes de usar cruzamentos territoriais sensíveis.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-surface-1 border border-border rounded-3xl p-5">
            <p className="text-[9px] uppercase tracking-[0.25em] text-text-muted">{card.label}</p>
            <p className="text-2xl font-bold text-text mt-2">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-1 border border-border rounded-3xl p-5 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="flex-1 bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white transition-all placeholder:text-white/20"
            placeholder="CEP, cidade ou bairro..."
          />
          <button
            type="submit"
            className="bg-primary text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
          >
            Buscar
          </button>
        </form>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white"
          title="Filtro de CEPs"
        >
          <option value="baixa-confianca" className="bg-[#141413]">Baixa confiança</option>
          <option value="ambiguos" className="bg-[#141413]">Ambíguos</option>
          <option value="revisados" className="bg-[#141413]">Revisados</option>
          <option value="todos" className="bg-[#141413]">Todos</option>
        </select>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const localidades = Array.isArray(item.localidades) ? item.localidades.slice(0, 6) : [];
          return (
            <div key={item.cep} className="bg-surface-1 border border-border rounded-3xl p-5 flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-xl font-bold text-text font-mono tracking-widest">{item.cep}</p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-text-muted mt-2">
                    {item.cidade} • {item.bairro || 'Sem bairro principal'}
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[8px] text-text-muted uppercase tracking-widest">Confiança</p>
                    <p className="text-sm font-bold text-primary mt-1">{formatPct(item.bairro_confianca)}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[8px] text-text-muted uppercase tracking-widest">Localidades</p>
                    <p className="text-sm font-bold text-text mt-1">{item.localidades_count}</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 px-3 py-2">
                    <p className="text-[8px] text-text-muted uppercase tracking-widest">Registros</p>
                    <p className="text-sm font-bold text-text mt-1">{item.total_registros.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>

              {localidades.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {localidades.map((localidade) => (
                    <button
                      key={`${item.cep}-${localidade.bairro}`}
                      type="button"
                      disabled={savingCep === item.cep}
                      onClick={() => reviseCep(item.cep, localidade.bairro)}
                      className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                        item.bairro === localidade.bairro
                          ? 'border-primary/60 bg-primary/10'
                          : 'border-white/10 bg-white/[0.03] hover:border-primary/30'
                      }`}
                    >
                      <span className="min-w-0 text-[10px] uppercase tracking-[0.16em] font-bold text-text break-words">
                        {localidade.bairro}
                      </span>
                      <span className="shrink-0 text-[9px] text-text-muted font-mono">
                        {formatPct(localidade.proporcao)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-border/50 pt-4">
                <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted">
                  Origem: {item.origem} • Logradouros: {item.logradouros_count}
                </p>
                <p className="text-[9px] uppercase tracking-[0.22em] text-text-muted">
                  Importado em: {formatDate(item.importado_em)}
                </p>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">
            Carregando território...
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="p-20 text-center text-text-muted uppercase tracking-widest text-[10px]">
            Nenhum CEP encontrado.
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
          className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Anterior
        </button>
        <span className="text-[10px] font-mono text-text-muted tracking-widest">
          {total.toLocaleString('pt-BR')} itens • {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
          className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          Próximo
        </button>
      </div>
    </div>
  );
}
