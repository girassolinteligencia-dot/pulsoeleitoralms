'use client';

import { useEffect, useState } from 'react';

interface TokenEntry {
  id: string;
  chave: string;
  descricao: string;
  token: string;
  ativo: boolean;
  criado_em: string;
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<TokenEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [descricao, setDescricao] = useState('');
  const [criando, setCriando] = useState(false);
  const [novoToken, setNovoToken] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const fetchTokens = async () => {
    const res = await fetch('/api/admin/api-tokens');
    if (res.ok) setTokens(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTokens(); }, []);

  const criarToken = async () => {
    if (!descricao.trim()) return;
    setCriando(true);
    const res = await fetch('/api/admin/api-tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ descricao }),
    });
    if (res.ok) {
      const data = await res.json();
      setNovoToken(data.token);
      setDescricao('');
      await fetchTokens();
    }
    setCriando(false);
  };

  const toggleAtivo = async (id: string, ativo: boolean) => {
    await fetch('/api/admin/api-tokens', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ativo: !ativo }),
    });
    await fetchTokens();
  };

  const excluir = async (id: string) => {
    if (!confirm('Excluir este token permanentemente?')) return;
    await fetch(`/api/admin/api-tokens?id=${id}`, { method: 'DELETE' });
    await fetchTokens();
  };

  const copiar = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-display font-bold text-white uppercase tracking-widest">
          API Pública — Tokens
        </h1>
        <p className="text-text-muted text-xs mt-1">
          Gere tokens de acesso para integrar seu site externo com os dados do PULSOMS.IA.
        </p>
      </div>

      {/* Endpoint de referência */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5 space-y-3">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Endpoint</p>
        <code className="block text-xs text-primary bg-dark/60 rounded-xl px-4 py-3 break-all">
          GET /api/public/resultados
        </code>
        <div className="text-xs text-text-muted space-y-1">
          <p><span className="text-white">Autenticação:</span> header <code className="text-primary">x-api-token: seu_token</code> ou <code className="text-primary">?token=seu_token</code></p>
          <p><span className="text-white">Parâmetros opcionais:</span></p>
          <ul className="pl-4 space-y-1 list-disc">
            <li><code className="text-primary">categoria</code> — <code>todos</code> (padrão) | <code>politico</code> | <code>orgao_publico</code> | <code>servico_publico</code></li>
            <li><code className="text-primary">dias</code> — janela de tempo em dias (padrão: <code>30</code>)</li>
            <li><code className="text-primary">atributos</code> — lista separada por vírgula, ou <code>todos</code> (padrão)</li>
            <li><code className="text-primary">limite</code> — número de entidades no ranking (padrão: <code>20</code>, máx: <code>100</code>)</li>
          </ul>
        </div>
        <p className="text-[10px] text-text-muted/60">Resposta inclui: ranking de entidades, atributos mais citados, totais e lista de atributos disponíveis.</p>
      </div>

      {/* Novo token gerado */}
      {novoToken && (
        <div className="bg-positive/10 border border-positive/30 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-positive">
            Token gerado — copie agora, não será exibido novamente
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 text-xs text-white bg-dark/60 rounded-xl px-4 py-3 break-all">
              {novoToken}
            </code>
            <button
              type="button"
              onClick={() => copiar(novoToken)}
              className="shrink-0 px-4 py-2 rounded-xl bg-positive/20 text-positive text-[10px] uppercase font-bold tracking-widest hover:bg-positive/30 transition-colors"
            >
              {copiado ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setNovoToken(null)}
            className="text-[10px] text-text-muted hover:text-white transition-colors uppercase font-bold tracking-widest"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Criar novo token */}
      <div className="bg-surface-1 border border-border rounded-2xl p-5 space-y-4">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">Novo Token</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && criarToken()}
            placeholder="Descrição (ex: Site Institucional)"
            className="flex-1 bg-dark/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            type="button"
            onClick={criarToken}
            disabled={criando || !descricao.trim()}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-dark text-[10px] uppercase font-bold tracking-widest hover:bg-primary/80 disabled:opacity-40 transition-colors"
          >
            {criando ? 'Gerando...' : 'Gerar'}
          </button>
        </div>
      </div>

      {/* Lista de tokens */}
      <div className="space-y-3">
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
          Tokens existentes ({tokens.length})
        </p>
        {loading && (
          <p className="text-text-muted text-xs">Carregando...</p>
        )}
        {!loading && tokens.length === 0 && (
          <p className="text-text-muted text-xs">Nenhum token criado ainda.</p>
        )}
        {tokens.map(t => (
          <div
            key={t.id}
            className={`bg-surface-1 border rounded-2xl p-4 flex items-center gap-4 ${t.ativo ? 'border-border' : 'border-white/5 opacity-50'}`}
          >
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${t.ativo ? 'bg-positive/20 text-positive' : 'bg-white/10 text-text-muted'}`}>
                  {t.ativo ? 'Ativo' : 'Revogado'}
                </span>
                <span className="text-sm font-semibold text-white truncate">{t.descricao}</span>
              </div>
              <code className="text-[10px] text-text-muted">{t.token}</code>
              <p className="text-[10px] text-text-muted/60">
                Criado em {new Date(t.criado_em).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleAtivo(t.id, t.ativo)}
                className="px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest border border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-colors"
              >
                {t.ativo ? 'Revogar' : 'Reativar'}
              </button>
              <button
                type="button"
                onClick={() => excluir(t.id)}
                className="px-3 py-1.5 rounded-xl text-[9px] uppercase font-bold tracking-widest border border-negative/20 text-negative/60 hover:text-negative hover:border-negative/40 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
