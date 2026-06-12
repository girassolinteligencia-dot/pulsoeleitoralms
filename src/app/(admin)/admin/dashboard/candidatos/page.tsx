'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/adminClient';
import { GestaoAtributos } from '@/components/admin/GestaoAtributos';
import { MUNICIPIOS_MS } from '@/lib/municipios-ms';
import { AvatarSelector } from '@/components/admin/AvatarSelector';

type Aba = 'lista' | 'atributos';

interface Candidato {
  id: string;
  nome: string;
  partido: string | null;
  numero: string | null;
  cargo: string;
  cidade: string;
  bairro: string | null;
  ano_eleicao: number;
  status: string;
  status_verificacao: boolean;
  campanha?: { id: string; nome: string };
}

interface Campanha {
  id: string;
  nome: string;
  status: string;
}

interface PaginatedResponse {
  data: Candidato[];
  total: number;
  page: number;
  totalPages: number;
}

const CAMPOS_OBRIGATORIOS = ['nome', 'cargo', 'cidade'] as const;

const novoVazio = () => ({
  nome: '',
  partido: '',
  numero: '',
  cargo: '',
  cidade: '',
  bairro: '',
  foto_url: '',
  campanha_id: '',
  ano_eleicao: '2026',
});

const MAX_FOTO_KB = 300;

export default function ManageCandidatos() {
  const [aba, setAba] = useState<Aba>('lista');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 50;

  // Edição
  const [editingCandidato, setEditingCandidato] = useState<Partial<Candidato> | null>(null);
  const [updating, setUpdating] = useState(false);

  // Novo candidato
  const [showNovo, setShowNovo] = useState(false);
  const [novoCandidato, setNovoCandidato] = useState(novoVazio());
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [campanhaDefault, setCampanhaDefault] = useState('');
  const [criando, setCriando] = useState(false);
  const [duplicados, setDuplicados] = useState<Candidato[]>([]);
  const [novoErro, setNovoErro] = useState('');
  const [novoSucesso, setNovoSucesso] = useState('');

  // Upload de foto (novo candidato ainda sem id)
  const novoFotoRef = useRef<File | null>(null);

  const fetchCandidatos = useCallback(async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: String(LIMIT), ...(searchTerm && { search: searchTerm }) });
      const res = await adminFetch(`/api/admin/candidatos?${params}`);
      const result: PaginatedResponse = await res.json();
      setCandidatos(result.data || []);
      setTotalPages(result.totalPages || 1);
      setTotal(result.total || 0);
    } catch {
      setCandidatos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCampanhas = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/campanhas?limit=50');
      const data = await res.json();
      const lista: Campanha[] = data.data || data || [];
      setCampanhas(lista);
      // Default: Campanha MS-2026
      const ms2026 = lista.find(c => c.nome.toLowerCase().includes('2026'));
      if (ms2026) {
        setCampanhaDefault(ms2026.id);
        setNovoCandidato(prev => ({ ...prev, campanha_id: ms2026.id }));
      }
    } catch {
      setCampanhas([]);
    }
  }, []);

  useEffect(() => { fetchCandidatos(page, search); }, [page, search, fetchCandidatos]);
  useEffect(() => { fetchCampanhas(); }, [fetchCampanhas]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

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
      if (res.ok) { setEditingCandidato(null); fetchCandidatos(page, search); }
    } finally {
      setUpdating(false);
    }
  };

  const abrirNovo = () => {
    setNovoCandidato({ ...novoVazio(), campanha_id: campanhaDefault });
    setDuplicados([]);
    setNovoErro('');
    setNovoSucesso('');
    novoFotoRef.current = null;
    setShowNovo(true);
  };

  const handleCriar = async (e: React.FormEvent, forcar = false) => {
    e.preventDefault();
    setNovoErro('');
    setNovoSucesso('');
    setDuplicados([]);

    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (!novoCandidato[campo]?.trim()) {
        setNovoErro(`Campo obrigatório: ${campo}`);
        return;
      }
    }
    if (!novoCandidato.campanha_id) { setNovoErro('Selecione um ciclo de avaliação.'); return; }

    setCriando(true);
    try {
      const body = { ...novoCandidato, ...(forcar ? {} : {}) };
      const res = await adminFetch('/api/admin/candidatos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 409) {
        const data = await res.json();
        setDuplicados(data.existentes || []);
        setNovoErro('Político já encontrado na plataforma (veja abaixo). Verifique se é o mesmo antes de prosseguir.');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setNovoErro(data.error || 'Erro ao criar político.');
        return;
      }

      const criado = await res.json();

      // Upload da foto se selecionada
      if (novoFotoRef.current && criado?.id) {
        const fd = new FormData();
        fd.append('foto', novoFotoRef.current);
        fd.append('candidatoId', criado.id);
        const resF = await adminFetch('/api/admin/candidatos/foto', { method: 'POST', body: fd });
        if (resF.ok) {
          const { foto_url } = await resF.json();
          await adminFetch('/api/admin/candidatos', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: criado.id, foto_url }),
          });
        }
        novoFotoRef.current = null;
      }

      setNovoSucesso('Político cadastrado com sucesso!');
      setNovoCandidato({ ...novoVazio(), campanha_id: campanhaDefault });
      setDuplicados([]);
      fetchCandidatos(page, search);
    } finally {
      setCriando(false);
    }
  };

  const inputClass = 'w-full bg-[#1c1c1c] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:border-primary outline-none transition-all placeholder:text-white/20 appearance-none';
  const labelClass = 'text-[10px] uppercase font-bold text-primary tracking-widest ml-1';

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Gestão de Políticos</h2>
          <p className="text-[11px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            {total > 0 ? `${total.toLocaleString('pt-BR')} políticos no escopo público — Página ${page}/${totalPages}` : 'Carregando...'}
          </p>
        </div>

        {aba === 'lista' && (
          <div className="w-full md:w-auto flex gap-3">
            <form onSubmit={handleSearch} className="flex gap-3 flex-1 md:flex-none">
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 md:w-64 bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-3 text-xs text-white transition-all placeholder:text-white/20"
                placeholder="Nome, cargo, partido ou cidade..."
              />
              <button type="submit" className="bg-primary text-white px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">🔍</button>
            </form>
            <button
              onClick={abrirNovo}
              className="bg-primary/20 border border-primary/40 text-primary px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-white active:scale-95 transition-all whitespace-nowrap"
            >
              + Novo
            </button>
          </div>
        )}
      </div>

      {/* Abas */}
      <nav className="flex gap-2 border-b border-white/5 pb-4">
        {([['lista', '👥', 'Políticos'], ['atributos', '🏷️', 'Atributos']] as const).map(([id, icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setAba(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${aba === id ? 'bg-primary/10 text-primary border border-primary/20' : 'text-text-muted hover:text-white border border-transparent hover:border-white/10'}`}
          >
            <span>{icon}</span><span>{label}</span>
          </button>
        ))}
      </nav>

      {aba === 'atributos' && <GestaoAtributos categoriaFixa="politico" />}

      {aba === 'lista' && <>
      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[22%]" />
            <col className="w-[9%]" />
            <col className="w-[8%]" />
            <col className="w-[13%]" />
            <col className="w-[7%]" />
            <col className="w-[14%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nome</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Partido</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nº</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cargo</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ano</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cidade</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Visível</th>
              <th className="px-3 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map(cand => (
              <tr key={cand.id} className={`border-b border-border/30 hover:bg-white/[0.01] transition-colors group ${cand.status === 'Inativo' ? 'opacity-40' : ''}`}>
                <td className="px-4 py-4 text-xs font-bold text-text truncate">{cand.nome}</td>
                <td className="px-3 py-4 text-[10px] font-bold text-[#d97757] truncate">{cand.partido || '-'}</td>
                <td className="px-3 py-4 text-[10px] font-mono text-text-muted">{cand.numero || '-'}</td>
                <td className="px-3 py-4 text-[10px] uppercase font-medium text-text-muted truncate">{cand.cargo}</td>
                <td className="px-3 py-4 text-[10px] font-mono text-text-muted">{cand.ano_eleicao}</td>
                <td className="px-3 py-4 text-[10px] text-text-muted truncate">{cand.cidade}</td>
                <td className="px-3 py-4">
                  <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${cand.status === 'Ativo' ? 'bg-positive/10 text-positive' : 'bg-white/5 text-text-muted'}`}>
                    {cand.status}
                  </span>
                </td>
                <td className="px-3 py-4">
                  <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-1 rounded-full ${cand.status_verificacao ? 'bg-primary/10 text-primary' : 'bg-white/5 text-text-muted'}`}>
                    {cand.status_verificacao ? 'Sim' : 'Não'}
                  </span>
                </td>
                <td className="px-3 py-4 text-right">
                  <button type="button" onClick={() => setEditingCandidato(cand)} className="text-[10px] font-bold text-primary hover:text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">Sincronizando...</div>}
        {!loading && candidatos.length === 0 && (
          <div className="p-20 text-center text-text-muted uppercase tracking-widest text-[10px]">
            Nenhum político encontrado{search ? ` para "${search}"` : ''}
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
              <span className="bg-primary/10 text-primary text-[10px] font-mono px-3 py-1 rounded-full font-bold">{cand.numero || '--'}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-border/50">
              <span className="text-[10px] font-bold text-[#d97757] uppercase tracking-widest">{cand.partido || 'Sem Partido'}</span>
              <button type="button" onClick={() => setEditingCandidato(cand)} className="text-[10px] font-bold text-primary uppercase tracking-widest">Editar</button>
            </div>
          </div>
        ))}
        {loading && <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">Carregando...</div>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all">← Anterior</button>
          <span className="text-[10px] font-mono text-text-muted tracking-widest">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="bg-white/5 border border-white/10 rounded-full px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all">Próximo →</button>
        </div>
      )}
      </>}

      {/* Modal — Novo Candidato */}
      {showNovo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div onClick={() => setShowNovo(false)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl my-8">
            <h3 className="text-xl font-bold font-display uppercase tracking-widest mb-2">Novo Político</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-8">
              Por padrão incluído no Ciclo MS-2026. Verificação automática de duplicidade antes de salvar.
            </p>

            <form onSubmit={handleCriar} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Nome Completo *</label>
                  <input type="text" value={novoCandidato.nome} onChange={e => setNovoCandidato({ ...novoCandidato, nome: e.target.value })} className={inputClass} placeholder="Nome completo conforme TSE" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="novo-cargo" className={labelClass}>Cargo *</label>
                  <select id="novo-cargo" aria-label="Cargo" value={novoCandidato.cargo} onChange={e => setNovoCandidato({ ...novoCandidato, cargo: e.target.value })} className={inputClass} required>
                    <option value="">Selecione...</option>
                    <option value="PRESIDENTE">Presidente</option>
                    <option value="VICE-PRESIDENTE">Vice-Presidente</option>
                    <option value="GOVERNADOR">Governador</option>
                    <option value="VICE-GOVERNADOR">Vice-Governador</option>
                    <option value="SENADOR">Senador</option>
                    <option value="DEPUTADO FEDERAL">Deputado Federal</option>
                    <option value="DEPUTADO ESTADUAL">Deputado Estadual</option>
                    <option value="PREFEITO">Prefeito</option>
                    <option value="VICE-PREFEITO">Vice-Prefeito</option>
                    <option value="VEREADOR">Vereador</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Cidade *</label>
                  <select value={novoCandidato.cidade} onChange={e => setNovoCandidato({ ...novoCandidato, cidade: e.target.value })} title="Município do MS" className={inputClass} required>
                    <option value="">Selecione o município...</option>
                    {MUNICIPIOS_MS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Partido</label>
                  <input type="text" value={novoCandidato.partido} onChange={e => setNovoCandidato({ ...novoCandidato, partido: e.target.value })} className={inputClass} placeholder="Ex: PT, PL, PSDB..." />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="novo-campanha" className={labelClass}>Ciclo de Avaliação *</label>
                  <select id="novo-campanha" aria-label="Ciclo de Avaliação" value={novoCandidato.campanha_id} onChange={e => setNovoCandidato({ ...novoCandidato, campanha_id: e.target.value })} className={inputClass} required>
                    <option value="">Selecione um ciclo...</option>
                    {campanhas.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nome}{c.id === campanhaDefault ? ' (padrão)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Foto do Político</label>
                  <AvatarSelector
                    kind="politico"
                    endpoint="/api/admin/candidatos/foto"
                    fieldName="candidatoId"
                    onFile={(file) => { novoFotoRef.current = file; }}
                    placeholder="👤"
                  />
                </div>
              </div>

              {/* Aviso de duplicidade */}
              {duplicados.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5 flex flex-col gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-400">⚠ Registro(s) semelhante(s) encontrado(s) na plataforma:</p>
                  {duplicados.map(d => (
                    <div key={d.id} className="text-[10px] text-yellow-200/70 font-mono leading-relaxed">
                      {d.nome} | {d.cargo} | {d.cidade} | {d.partido || 'S/P'} | {d.ano_eleicao} | {(d as any).campanha}
                    </div>
                  ))}
                  <p className="text-[10px] text-yellow-300/60 mt-1">Se for um político diferente com nome similar, corrija o nome e tente novamente.</p>
                </div>
              )}

              {novoErro && duplicados.length === 0 && (
                <p className="text-[10px] text-negative font-bold uppercase tracking-widest">{novoErro}</p>
              )}
              {novoSucesso && (
                <p className="text-[10px] text-positive font-bold uppercase tracking-widest">{novoSucesso}</p>
              )}

              <div className="flex gap-4 mt-2">
                <button type="submit" disabled={criando} className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                  {criando ? 'Verificando...' : 'Cadastrar Político'}
                </button>
                <button type="button" onClick={() => setShowNovo(false)} className="px-8 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal — Editar Candidato */}
      {editingCandidato && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => setEditingCandidato(null)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl">
            <h3 className="text-xl font-bold font-display uppercase tracking-widest mb-8">Editar Político</h3>
            <form onSubmit={handleUpdate} className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Nome Completo</label>
                  <input type="text" value={editingCandidato.nome || ''} onChange={e => setEditingCandidato({ ...editingCandidato, nome: e.target.value })} className={inputClass} placeholder="Nome Completo" required />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Partido</label>
                  <input type="text" value={editingCandidato.partido || ''} onChange={e => setEditingCandidato({ ...editingCandidato, partido: e.target.value })} className={inputClass} placeholder="Ex: PT, PL..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Número</label>
                  <input type="text" value={editingCandidato.numero || ''} onChange={e => setEditingCandidato({ ...editingCandidato, numero: e.target.value })} className={inputClass} placeholder="Ex: 13..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Cargo</label>
                  <input type="text" value={editingCandidato.cargo || ''} onChange={e => setEditingCandidato({ ...editingCandidato, cargo: e.target.value })} className={inputClass} placeholder="Ex: Vereador..." />
                </div>
                <div className="flex flex-col gap-2">
                  <label className={labelClass}>Cidade</label>
                  <select value={editingCandidato.cidade || ''} onChange={e => setEditingCandidato({ ...editingCandidato, cidade: e.target.value })} title="Município do MS" className={inputClass}>
                    <option value="">Selecione o município...</option>
                    {MUNICIPIOS_MS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className={labelClass}>Foto do Político</label>
                  <AvatarSelector
                    kind="politico"
                    currentUrl={(editingCandidato as any).foto_url}
                    entityId={editingCandidato.id}
                    endpoint="/api/admin/candidatos/foto"
                    deleteEndpoint="/api/admin/candidatos/foto"
                    fieldName="candidatoId"
                    onUploaded={(url) => setEditingCandidato(prev => prev ? { ...prev, foto_url: url } as any : prev)}
                    placeholder="👤"
                  />
                </div>
              </div>

              {/* Toggle nome completo */}
              <div className="flex items-center justify-between gap-4 bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-text">Exibir Nome Completo</p>
                  <p className="text-[10px] text-text-muted mt-1 opacity-60">
                    Por padrão exibe apenas o nome de urna. Ative para mostrar o nome completo na plataforma.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCandidato({ ...editingCandidato, status_verificacao: !editingCandidato.status_verificacao })}
                  aria-label={editingCandidato.status_verificacao ? 'Desativar exibição do nome completo' : 'Ativar exibição do nome completo'}
                  title={editingCandidato.status_verificacao ? 'Desativar exibição do nome completo' : 'Ativar exibição do nome completo'}
                  className={`relative shrink-0 w-12 h-6 rounded-full transition-all duration-300 ${editingCandidato.status_verificacao ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${editingCandidato.status_verificacao ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex gap-4 mt-4">
                <button type="submit" disabled={updating} className="flex-1 bg-primary text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-50">
                  {updating ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button type="button" onClick={() => setEditingCandidato(null)} className="px-8 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all">
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
