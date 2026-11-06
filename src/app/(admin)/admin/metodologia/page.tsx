'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch, downloadAdminFile } from '@/lib/adminClient';

type RodadaTipo = 'percepcao_espontanea' | 'pesquisa_registravel';
type RodadaStatus = 'rascunho' | 'ativa' | 'encerrada' | 'arquivada';

interface CampanhaOption {
  id: string;
  nome: string;
}

interface Rodada {
  id: string;
  titulo: string;
  tipo: RodadaTipo;
  status: RodadaStatus;
  campanha_id: string | null;
  objetivo: string | null;
  publico_alvo: string | null;
  abrangencia: string | null;
  tamanho_amostra: number | null;
  margem_erro: number | null;
  nivel_confianca: number | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  plano_amostral: unknown;
  ponderacao: unknown;
  questionario: unknown;
  observacoes: string | null;
  criado_em: string;
  campanha?: {
    nome: string;
    slug: string;
  } | null;
}

interface RodadasResponse {
  data: Rodada[];
  total: number;
  page: number;
  totalPages: number;
}

type RodadaForm = {
  id?: string;
  titulo: string;
  tipo: RodadaTipo;
  status: RodadaStatus;
  campanha_id: string;
  objetivo: string;
  publico_alvo: string;
  abrangencia: string;
  tamanho_amostra: string;
  margem_erro: string;
  nivel_confianca: string;
  periodo_inicio: string;
  periodo_fim: string;
  plano_amostral: string;
  ponderacao: string;
  questionario: string;
  observacoes: string;
};

const EMPTY_FORM: RodadaForm = {
  titulo: '',
  tipo: 'percepcao_espontanea',
  status: 'rascunho',
  campanha_id: '',
  objetivo: '',
  publico_alvo: '',
  abrangencia: '',
  tamanho_amostra: '',
  margem_erro: '',
  nivel_confianca: '',
  periodo_inicio: '',
  periodo_fim: '',
  plano_amostral: '',
  ponderacao: '',
  questionario: '',
  observacoes: '',
};

const TIPO_LABEL: Record<RodadaTipo, string> = {
  percepcao_espontanea: 'Percepção Espontânea',
  pesquisa_registravel: 'Pesquisa Registrável',
};

const STATUS_LABEL: Record<RodadaStatus, string> = {
  rascunho: 'Rascunho',
  ativa: 'Ativa',
  encerrada: 'Encerrada',
  arquivada: 'Arquivada',
};

const STATUS_STYLE: Record<RodadaStatus, string> = {
  rascunho: 'text-text-muted bg-white/5',
  ativa: 'text-positive bg-positive/10',
  encerrada: 'text-[#c8933a] bg-[#c8933a]/10',
  arquivada: 'text-negative bg-negative/10',
};

function formatJson(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value, null, 2);
}

function toInputDate(value: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function toForm(rodada: Rodada): RodadaForm {
  return {
    id: rodada.id,
    titulo: rodada.titulo,
    tipo: rodada.tipo,
    status: rodada.status,
    campanha_id: rodada.campanha_id || '',
    objetivo: rodada.objetivo || '',
    publico_alvo: rodada.publico_alvo || '',
    abrangencia: rodada.abrangencia || '',
    tamanho_amostra: rodada.tamanho_amostra ? String(rodada.tamanho_amostra) : '',
    margem_erro: rodada.margem_erro ? String(rodada.margem_erro) : '',
    nivel_confianca: rodada.nivel_confianca ? String(rodada.nivel_confianca) : '',
    periodo_inicio: toInputDate(rodada.periodo_inicio),
    periodo_fim: toInputDate(rodada.periodo_fim),
    plano_amostral: formatJson(rodada.plano_amostral),
    ponderacao: formatJson(rodada.ponderacao),
    questionario: formatJson(rodada.questionario),
    observacoes: rodada.observacoes || '',
  };
}

function getGovernanceChecks(rodada: Rodada) {
  const checks = [
    { label: 'Campanha vinculada', ok: Boolean(rodada.campanha_id) },
    { label: 'Objetivo definido', ok: Boolean(rodada.objetivo?.trim()) },
    { label: 'Início de campo', ok: Boolean(rodada.periodo_inicio) },
  ];

  if (rodada.status === 'encerrada') {
    checks.push({ label: 'Fim de campo', ok: Boolean(rodada.periodo_fim) });
  }

  if (rodada.tipo === 'pesquisa_registravel') {
    checks.push(
      { label: 'Amostra', ok: Boolean(rodada.tamanho_amostra) },
      { label: 'Margem de erro', ok: Boolean(rodada.margem_erro) },
      { label: 'Nível de confiança', ok: Boolean(rodada.nivel_confianca) },
      { label: 'Plano amostral', ok: Boolean(rodada.plano_amostral) },
      { label: 'Questionário', ok: Boolean(rodada.questionario) },
    );
  }

  return checks;
}

export default function MetodologiaAdminPage() {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [campanhas, setCampanhas] = useState<CampanhaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RodadaForm>(EMPTY_FORM);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('');
  const [search, setSearch] = useState('');

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '50' });
    if (tipoFiltro) params.set('tipo', tipoFiltro);
    if (statusFiltro) params.set('status', statusFiltro);
    if (search) params.set('search', search);
    return params.toString();
  }, [tipoFiltro, statusFiltro, search]);

  const fetchRodadas = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/api/admin/rodadas?${query}`);
      const data: RodadasResponse = await res.json();
      setRodadas(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar rodadas:', error);
      setRodadas([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    fetchRodadas();
  }, [fetchRodadas]);

  useEffect(() => {
    const fetchCampanhas = async () => {
      try {
        const res = await adminFetch('/api/admin/campanhas?limit=100');
        const data = await res.json();
        setCampanhas(data.data || []);
      } catch (error) {
        console.error('Erro ao buscar campanhas:', error);
      }
    };

    fetchCampanhas();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (rodada: Rodada) => {
    setForm(toForm(rodada));
    setShowForm(true);
  };

  const updateForm = (field: keyof RodadaForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        campanha_id: form.campanha_id || null,
        tamanho_amostra: form.tamanho_amostra || null,
        margem_erro: form.margem_erro || null,
        nivel_confianca: form.nivel_confianca || null,
        periodo_inicio: form.periodo_inicio || null,
        periodo_fim: form.periodo_fim || null,
      };

      const res = await adminFetch('/api/admin/rodadas', {
        method: form.id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar rodada');
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchRodadas();
    } catch (error) {
      console.error('Erro ao salvar rodada:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar rodada');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDossie = async (rodada: Rodada) => {
    setDownloadingId(rodada.id);
    try {
      await downloadAdminFile(
        `/api/admin/rodadas/${rodada.id}/dossie`,
        `dossie_${rodada.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}.json`
      );
    } catch (error) {
      console.error('Erro ao baixar dossiê:', error);
      alert(error instanceof Error ? error.message : 'Erro ao baixar dossiê');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadDossieHtml = async (rodada: Rodada) => {
    setDownloadingId(rodada.id);
    try {
      await downloadAdminFile(
        `/api/admin/rodadas/${rodada.id}/dossie?format=html`,
        `dossie_${rodada.titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '_')}.html`
      );
    } catch (error) {
      console.error('Erro ao baixar dossiê HTML:', error);
      alert(error instanceof Error ? error.message : 'Erro ao baixar dossiê HTML');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
            Metodologia
          </h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            Controle de rodadas, classificação metodológica e dossiê técnico
          </p>
        </div>

        <button
          onClick={openCreate}
          className="bg-primary text-white px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all"
        >
          + Nova Rodada
        </button>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
          placeholder="Buscar rodada..."
        />
        <select
          value={tipoFiltro}
          onChange={(event) => setTipoFiltro(event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        >
          <option value="">Todos os tipos</option>
          <option value="percepcao_espontanea">Percepção Espontânea</option>
          <option value="pesquisa_registravel">Pesquisa Registrável</option>
        </select>
        <select
          value={statusFiltro}
          onChange={(event) => setStatusFiltro(event.target.value)}
          className="bg-[#1c1814] border border-white/10 rounded-2xl px-5 py-4 text-xs text-white outline-none focus:border-primary"
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="ativa">Ativa</option>
          <option value="encerrada">Encerrada</option>
          <option value="arquivada">Arquivada</option>
        </select>
      </section>

      <section className="bg-primary/5 border border-primary/10 rounded-[2rem] p-6 md:p-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
          Governança Metodológica
        </h3>
        <p className="text-[11px] text-text-muted leading-relaxed max-w-4xl">
          Rodadas ativas exigem campanha, objetivo e início de campo. Pesquisas registráveis ativas ou encerradas exigem amostra, margem de erro, nível de confiança, plano amostral e questionário. Rodadas encerradas ou arquivadas ficam travadas para preservar o histórico metodológico.
        </p>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {rodadas.map((rodada) => (
          <article
            key={rodada.id}
            className="bg-surface-1 border border-border rounded-[2rem] p-6 md:p-8 flex flex-col gap-6"
          >
            <div className="flex justify-between gap-4 items-start">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-text">
                  {rodada.titulo}
                </h3>
                <p className="text-[9px] text-text-muted uppercase tracking-widest mt-2">
                  {rodada.campanha?.nome || 'Sem campanha vinculada'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${STATUS_STYLE[rodada.status]}`}>
                {STATUS_LABEL[rodada.status]}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] rounded-2xl p-4">
                <p className="text-[8px] text-text-muted uppercase tracking-widest">Tipo</p>
                <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-2">
                  {TIPO_LABEL[rodada.tipo]}
                </p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-4">
                <p className="text-[8px] text-text-muted uppercase tracking-widest">Campo</p>
                <p className="text-[11px] font-bold text-text mt-2">
                  {rodada.periodo_inicio ? new Date(rodada.periodo_inicio).toLocaleDateString('pt-BR') : '--'} até {rodada.periodo_fim ? new Date(rodada.periodo_fim).toLocaleDateString('pt-BR') : '--'}
                </p>
              </div>
            </div>

            {rodada.tipo === 'pesquisa_registravel' && (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-white/[0.02] rounded-2xl p-3">
                  <p className="text-[8px] text-text-muted uppercase tracking-widest">Amostra</p>
                  <p className="text-sm font-bold text-text mt-1">{rodada.tamanho_amostra || '--'}</p>
                </div>
                <div className="text-center bg-white/[0.02] rounded-2xl p-3">
                  <p className="text-[8px] text-text-muted uppercase tracking-widest">Erro</p>
                  <p className="text-sm font-bold text-text mt-1">{rodada.margem_erro ? `${rodada.margem_erro}%` : '--'}</p>
                </div>
                <div className="text-center bg-white/[0.02] rounded-2xl p-3">
                  <p className="text-[8px] text-text-muted uppercase tracking-widest">Conf.</p>
                  <p className="text-sm font-bold text-text mt-1">{rodada.nivel_confianca ? `${rodada.nivel_confianca}%` : '--'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {getGovernanceChecks(rodada).map((check) => (
                <div
                  key={check.label}
                  className={`rounded-2xl border px-4 py-3 text-[9px] uppercase tracking-widest font-bold ${
                    check.ok
                      ? 'border-positive/20 bg-positive/5 text-positive'
                      : 'border-negative/20 bg-negative/5 text-negative'
                  }`}
                >
                  {check.ok ? 'OK' : 'Pendente'} • {check.label}
                </div>
              ))}
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed line-clamp-3">
              {rodada.objetivo || rodada.observacoes || 'Sem descrição metodológica cadastrada.'}
            </p>

            <div className="flex flex-wrap gap-4">
              {['encerrada', 'arquivada'].includes(rodada.status) ? (
                <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted opacity-50">
                  Rodada travada
                </span>
              ) : (
                <button
                  onClick={() => openEdit(rodada)}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-white transition-colors"
                >
                  Editar rodada
                </button>
              )}
              <button
                onClick={() => handleDownloadDossie(rodada)}
                disabled={downloadingId === rodada.id}
                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white disabled:opacity-40 transition-colors"
              >
                {downloadingId === rodada.id ? 'Gerando dossiê' : 'Baixar JSON'}
              </button>
              <button
                onClick={() => handleDownloadDossieHtml(rodada)}
                disabled={downloadingId === rodada.id}
                className="text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-white disabled:opacity-40 transition-colors"
              >
                {downloadingId === rodada.id ? 'Gerando HTML' : 'Baixar HTML'}
              </button>
            </div>
          </article>
        ))}

        {!loading && rodadas.length === 0 && (
          <div className="xl:col-span-2 py-20 text-center bg-surface-1 border border-border rounded-[2rem]">
            <p className="text-[10px] text-text-muted uppercase tracking-widest">
              Nenhuma rodada metodológica cadastrada
            </p>
          </div>
        )}
      </section>

      {loading && (
        <div className="py-16 text-center text-text-muted animate-pulse uppercase tracking-widest text-[10px]">
          Carregando rodadas...
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div onClick={() => setShowForm(false)} className="absolute inset-0 bg-dark/80 backdrop-blur-sm" />
          <form
            onSubmit={handleSave}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-1 border border-border rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col gap-8"
          >
            <div className="flex justify-between items-start gap-4">
              <div>
                <h3 className="text-xl font-bold font-display uppercase tracking-widest text-text">
                  {form.id ? 'Editar Rodada' : 'Nova Rodada'}
                </h3>
                <p className="text-[9px] text-text-muted uppercase tracking-widest mt-2">
                  Classificação metodológica e dossiê técnico
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-text-muted hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Título</span>
                <input
                  value={form.titulo}
                  onChange={(event) => updateForm('titulo', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                  required
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Tipo</span>
                <select
                  value={form.tipo}
                  onChange={(event) => updateForm('tipo', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="percepcao_espontanea">Percepção Espontânea</option>
                  <option value="pesquisa_registravel">Pesquisa Registrável</option>
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => updateForm('status', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="ativa">Ativa</option>
                  <option value="encerrada">Encerrada</option>
                  <option value="arquivada">Arquivada</option>
                </select>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Campanha</span>
                <select
                  value={form.campanha_id}
                  onChange={(event) => updateForm('campanha_id', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                >
                  <option value="">Sem campanha vinculada</option>
                  {campanhas.map((campanha) => (
                    <option key={campanha.id} value={campanha.id}>{campanha.nome}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Objetivo</span>
                <textarea
                  value={form.objetivo}
                  onChange={(event) => updateForm('objetivo', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary min-h-24"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Público-alvo</span>
                <input
                  value={form.publico_alvo}
                  onChange={(event) => updateForm('publico_alvo', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Abrangência</span>
                <input
                  value={form.abrangencia}
                  onChange={(event) => updateForm('abrangencia', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Início do Campo</span>
                <input
                  type="date"
                  value={form.periodo_inicio}
                  onChange={(event) => updateForm('periodo_inicio', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Fim do Campo</span>
                <input
                  type="date"
                  value={form.periodo_fim}
                  onChange={(event) => updateForm('periodo_fim', event.target.value)}
                  className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                />
              </label>
            </div>

            {form.tipo === 'pesquisa_registravel' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-border pt-8">
                <label className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Tamanho da Amostra</span>
                  <input
                    type="number"
                    value={form.tamanho_amostra}
                    onChange={(event) => updateForm('tamanho_amostra', event.target.value)}
                    className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Margem de Erro (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.margem_erro}
                    onChange={(event) => updateForm('margem_erro', event.target.value)}
                    className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Confiança (%)</span>
                  <input
                    type="number"
                    step="0.1"
                    value={form.nivel_confianca}
                    onChange={(event) => updateForm('nivel_confianca', event.target.value)}
                    className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-3">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Plano Amostral (JSON ou texto)</span>
                  <textarea
                    value={form.plano_amostral}
                    onChange={(event) => updateForm('plano_amostral', event.target.value)}
                    className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary min-h-24 font-mono"
                  />
                </label>

                <label className="flex flex-col gap-2 md:col-span-3">
                  <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Ponderação (JSON ou texto)</span>
                  <textarea
                    value={form.ponderacao}
                    onChange={(event) => updateForm('ponderacao', event.target.value)}
                    className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary min-h-24 font-mono"
                  />
                </label>
              </div>
            )}

            <label className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Questionário (JSON ou texto)</span>
              <textarea
                value={form.questionario}
                onChange={(event) => updateForm('questionario', event.target.value)}
                className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary min-h-24 font-mono"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-[9px] uppercase font-bold text-primary tracking-widest">Observações</span>
              <textarea
                value={form.observacoes}
                onChange={(event) => updateForm('observacoes', event.target.value)}
                className="bg-dark border border-border rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-primary min-h-24"
              />
            </label>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-4 bg-transparent border border-border text-text-muted rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-4 bg-primary text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {saving ? 'Salvando...' : 'Salvar Rodada'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
