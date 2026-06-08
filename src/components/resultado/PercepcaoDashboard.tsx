'use client';

import React, { useState } from 'react';

interface IndicadorItem {
  nome: string;
  total: number;
  pct?: number;
}

interface IndicadorRegiao extends IndicadorItem {
  saldo?: number;
  aprovamPct?: number;
}

interface TendenciaItem {
  nome: string;
  valor: number;
  pctHistorico: number;
  pctRecente: number;
  delta: number;
}

interface PercepcaoData {
  resumo: {
    vozesValidas: number;
    aprovacoes: number;
    desaprovacoes: number;
    semRespostaAprovacao: number;
    expectativaVitoria: number;
    aprovacaoPct: number;
    desaprovacaoPct: number;
    expectativaPct: number;
    saldoPercepcao: number;
  };
  leitura: {
    titulo: string;
    descricao: string;
    tom: 'positivo' | 'negativo' | 'neutro' | string;
  };
  atributos: {
    forcas: IndicadorItem[];
    alertas: IndicadorItem[];
  };
  tendencias?: TendenciaItem[];
  origem?: {
    cidades: IndicadorRegiao[];
    bairros: IndicadorRegiao[];
  };
  ideologia?: IndicadorItem[];
  demografico?: {
    sexo: IndicadorItem[];
    escolaridade: IndicadorItem[];
    faixaSalarial: IndicadorItem[];
    ocupacao: IndicadorItem[];
  };
  comparativoCargo?: {
    cargo: string;
    posicao: number;
    total: number;
    liquidScore: number;
  };
  aviso: string;
}

interface BlocosConfig {
  termometro?: boolean;
  expectativa?: boolean;
  forcas?: boolean;
  tendencias?: boolean;
  ideologia?: boolean;
  demografico?: boolean;
  regional?: boolean;
  cargo?: boolean;
  [key: string]: boolean | undefined;
}

interface PercepcaoDashboardProps {
  data: PercepcaoData | null;
  blocos?: BlocosConfig;
}

// ── helpers visuais ────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-[#1c1814] border border-[#3d3128] rounded-xl p-4 flex flex-col gap-3 ${className}`}>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[9px] uppercase tracking-[0.2em] text-[#f5f0e8] font-bold leading-relaxed">
      {children}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-[10px] text-[#7a6e64] leading-relaxed italic">{text}</p>;
}

// ── 1. Termômetro de Aprovação ────────────────────────────────────

function Termometro({ resumo }: { resumo: PercepcaoData['resumo'] }) {
  const { aprovacaoPct, desaprovacaoPct, semRespostaAprovacao, vozesValidas, saldoPercepcao } = resumo;
  const semPct = vozesValidas > 0 ? 100 - aprovacaoPct - desaprovacaoPct : 0;
  const tomCor = saldoPercepcao >= 15 ? '#a8c47a' : saldoPercepcao <= -15 ? '#d97757' : '#c8933a';

  return (
    <Card>
      <SectionTitle>Termômetro de Aprovação</SectionTitle>
      <div className="flex flex-col gap-2">
        {/* Barra dividida */}
        <div className="flex h-3 w-full rounded-full overflow-hidden gap-px">
          <div className="bg-[#a8c47a] transition-all duration-700" style={{ width: `${aprovacaoPct}%` }} />
          <div className="bg-[#3d3128] transition-all duration-700" style={{ width: `${semPct}%` }} />
          <div className="bg-[#d97757] transition-all duration-700" style={{ width: `${desaprovacaoPct}%` }} />
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-start">
            <span className="text-[#a8c47a] text-base font-bold tabular-nums">{aprovacaoPct}%</span>
            <span className="text-[8px] text-[#7a6e64] uppercase tracking-widest">Aprovam</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tabular-nums" style={{ color: tomCor }}>
              {saldoPercepcao >= 0 ? '+' : ''}{saldoPercepcao}
            </span>
            <span className="text-[8px] text-[#7a6e64] uppercase tracking-widest">Saldo</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[#d97757] text-base font-bold tabular-nums">{desaprovacaoPct}%</span>
            <span className="text-[8px] text-[#7a6e64] uppercase tracking-widest">Desaprovam</span>
          </div>
        </div>
        {semRespostaAprovacao > 0 && (
          <p className="text-[8px] text-[#7a6e64] text-center">
            {semPct}% não responderam à aprovação
          </p>
        )}
      </div>
    </Card>
  );
}

// ── 2. Índice de Expectativa de Vitória ──────────────────────────

function ExpectativaVitoria({ resumo }: { resumo: PercepcaoData['resumo'] }) {
  const { expectativaPct, aprovacaoPct, vozesValidas } = resumo;
  const tensao = aprovacaoPct > 0 && Math.abs(expectativaPct - aprovacaoPct) >= 15;

  return (
    <Card>
      <SectionTitle>Expectativa de Vitória</SectionTitle>
      {vozesValidas < 3 ? (
        <Empty text="Volume insuficiente para leitura de expectativa." />
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-[#c8933a] tabular-nums">{expectativaPct}%</span>
            <span className="text-[9px] text-[#7a6e64] uppercase tracking-widest mb-1">acreditam na vitória</span>
          </div>
          <Bar pct={expectativaPct} color="bg-[#c8933a]" />
          {tensao && (
            <p className="text-[9px] text-[#c8933a] leading-relaxed bg-[#c8933a]/10 border border-[#c8933a]/20 rounded-lg px-3 py-2">
              {expectativaPct > aprovacaoPct
                ? 'Mais pessoas acreditam na vitória do que efetivamente aprovam — fenômeno de voto útil ou percepção de força.'
                : 'Aprovação supera a expectativa de vitória — potencial de rejeição tática.'}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

// ── 3. Mapa Ideológico ────────────────────────────────────────────

const IDEOLOGIA_COR: Record<string, string> = {
  progressista: '#a8c47a',
  'centro-esquerda': '#8fb88e',
  moderado: '#c8933a',
  'centro-direita': '#d99d57',
  conservador: '#d97757',
};

function MapaIdeologico({ ideologia }: { ideologia: IndicadorItem[] }) {
  return (
    <Card>
      <SectionTitle>Espectro Ideológico das Vozes</SectionTitle>
      {ideologia.length === 0 ? (
        <Empty text="Dados ideológicos ainda não disponíveis em volume suficiente." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {ideologia.map((item) => {
            const cor = IDEOLOGIA_COR[item.nome.toLowerCase()] ?? '#7a6e64';
            return (
              <div key={item.nome} className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-[#b0aea5] uppercase tracking-[0.1em]">{item.nome}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: cor }}>{item.pct ?? 0}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.pct ?? 0}%`, backgroundColor: cor }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

// ── 4. Perfil Demográfico ─────────────────────────────────────────

function DemograficoGroup({ label, items }: { label: string; items: IndicadorItem[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[8px] uppercase tracking-[0.2em] text-[#d97757] font-bold">{label}</span>
      {items.slice(0, 3).map((item) => (
        <div key={item.nome} className="flex justify-between items-center gap-2">
          <span className="text-[9px] text-[#b0aea5] truncate">{item.nome}</span>
          <span className="text-[9px] font-bold text-[#c8933a] tabular-nums shrink-0">{item.pct ?? 0}%</span>
        </div>
      ))}
    </div>
  );
}

function PerfilDemografico({ demografico }: { demografico: PercepcaoData['demografico'] }) {
  if (!demografico) return null;
  const temDados = [demografico.sexo, demografico.escolaridade, demografico.faixaSalarial, demografico.ocupacao]
    .some(arr => arr && arr.length > 0);

  return (
    <Card>
      <SectionTitle>Perfil Demográfico das Vozes</SectionTitle>
      {!temDados ? (
        <Empty text="Dados demográficos ainda não disponíveis em volume suficiente." />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <DemograficoGroup label="Sexo" items={demografico.sexo} />
          <DemograficoGroup label="Escolaridade" items={demografico.escolaridade} />
          <DemograficoGroup label="Renda" items={demografico.faixaSalarial} />
          <DemograficoGroup label="Ocupação" items={demografico.ocupacao} />
        </div>
      )}
    </Card>
  );
}

// ── 5. Força Regional com Saldo ───────────────────────────────────

function RegiaoComSaldo({ cidades }: { cidades: IndicadorRegiao[] }) {
  return (
    <Card>
      <SectionTitle>Força Regional</SectionTitle>
      <div className="flex flex-col gap-2">
        {cidades.length === 0 ? (
          <Empty text="Origem regional ainda não disponível em volume suficiente." />
        ) : (
          cidades.map(c => (
            <div key={c.nome} className="flex flex-col gap-1">
              <div className="flex justify-between items-center gap-2">
                <span className="text-[9px] text-[#b0aea5] truncate">{c.nome}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {c.saldo !== undefined && (
                    <span className={`text-[8px] font-bold ${c.saldo >= 0 ? 'text-[#a8c47a]' : 'text-[#d97757]'}`}>
                      {c.saldo >= 0 ? '+' : ''}{c.saldo}
                    </span>
                  )}
                  <span className="text-[9px] font-bold text-[#c8933a] tabular-nums">{c.pct ?? 0}%</span>
                </div>
              </div>
              <Bar pct={c.pct ?? 0} color={c.saldo !== undefined && c.saldo >= 0 ? 'bg-[#a8c47a]/50' : 'bg-[#d97757]/50'} />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

// ── 6. Tendências (48h vs histórico) ─────────────────────────────

function Tendencias({ tendencias }: { tendencias?: TendenciaItem[] }) {
  if (!tendencias || tendencias.length === 0) return null;
  const ascensao = tendencias.filter(t => t.delta > 0).slice(0, 3);
  const queda = tendencias.filter(t => t.delta < 0).slice(0, 3);
  if (ascensao.length === 0 && queda.length === 0) return null;

  return (
    <Card>
      <SectionTitle>Atributos em Movimento (últimas 48h)</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        {ascensao.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#a8c47a] font-bold">Ascensão</span>
            {ascensao.map(t => (
              <div key={t.nome} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-[#b0aea5] leading-tight">{t.nome}</span>
                <span className="text-[9px] font-bold text-[#a8c47a]">+{t.delta}pp</span>
              </div>
            ))}
          </div>
        )}
        {queda.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#d97757] font-bold">Queda</span>
            {queda.map(t => (
              <div key={t.nome} className="flex flex-col gap-0.5">
                <span className="text-[9px] text-[#b0aea5] leading-tight">{t.nome}</span>
                <span className="text-[9px] font-bold text-[#d97757]">{t.delta}pp</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="text-[8px] text-[#7a6e64]">pp = variação em pontos percentuais vs histórico total</p>
    </Card>
  );
}

// ── 7. Comparativo de Cargo ───────────────────────────────────────

function ComparativoCargo({ comparativo }: { comparativo: PercepcaoData['comparativoCargo'] }) {
  if (!comparativo || comparativo.total <= 1) return null;
  const { cargo, posicao, total, liquidScore } = comparativo;
  const pctPosicao = posicao === 1 ? 100 : Math.round(((total - posicao) / (total - 1)) * 100);

  return (
    <Card>
      <SectionTitle>Comparativo — {cargo}</SectionTitle>
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center shrink-0">
          <span className="text-3xl font-bold text-[#d97757] tabular-nums">{posicao}º</span>
          <span className="text-[8px] text-[#7a6e64] uppercase tracking-widest">de {total}</span>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <Bar pct={pctPosicao} color={posicao <= Math.ceil(total / 3) ? 'bg-[#a8c47a]' : posicao <= Math.ceil(total * 2 / 3) ? 'bg-[#c8933a]' : 'bg-[#d97757]'} />
          <p className="text-[9px] text-[#b0aea5] leading-relaxed">
            {posicao === 1
              ? 'Melhor percepção entre os candidatos ao mesmo cargo.'
              : `Entre os candidatos a ${cargo}, ocupa a ${posicao}ª posição em percepção líquida.`}
          </p>
          <span className="text-[8px] text-[#7a6e64]">
            Liquid score: <span className={`font-bold ${liquidScore >= 0 ? 'text-[#a8c47a]' : 'text-[#d97757]'}`}>{liquidScore >= 0 ? '+' : ''}{liquidScore}</span>
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── Dashboard principal ───────────────────────────────────────────

export const PercepcaoDashboard: React.FC<PercepcaoDashboardProps> = ({ data, blocos = {} }) => {
  const [mostrarAlerta, setMostrarAlerta] = useState(false);

  const b = {
    termometro:  blocos.termometro  !== false,
    forcas:      blocos.forcas      !== false,
    regional:    blocos.regional    !== false,
    expectativa: blocos.expectativa === true,
    tendencias:  blocos.tendencias  === true,
    ideologia:   blocos.ideologia   === true,
    demografico: blocos.demografico === true,
    cargo:       blocos.cargo       === true,
  };

  if (!data) {
    return (
      <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-5 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[#7a6e64] font-bold">
          Consolidando dados da percepção...
        </p>
      </div>
    );
  }

  const tomCor = data.leitura.tom === 'positivo' ? 'text-[#a8c47a] border-[#a8c47a]/20 bg-[#a8c47a]/5'
    : data.leitura.tom === 'negativo' ? 'text-[#d97757] border-[#d97757]/20 bg-[#d97757]/5'
    : 'text-[#c8933a] border-[#c8933a]/20 bg-[#c8933a]/5';

  return (
    <div className="w-full flex flex-col gap-3 pb-12">

      {/* Leitura rápida — sempre visível */}
      <div className={`rounded-xl border px-4 py-3 flex flex-col gap-1 ${tomCor}`}>
        <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{data.leitura.titulo}</span>
        <p className="text-[10px] leading-relaxed opacity-80">{data.leitura.descricao}</p>
      </div>

      {/* Termômetro de Aprovação */}
      {b.termometro && <Termometro resumo={data.resumo} />}

      {/* Expectativa de Vitória (desativado por padrão) */}
      {b.expectativa && <ExpectativaVitoria resumo={data.resumo} />}

      {/* Forças + Alertas */}
      {b.forcas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <SectionTitle>Principais forças percebidas</SectionTitle>
            {data.atributos.forcas.length === 0 ? (
              <Empty text="Ainda não há atributos positivos suficientes para destacar." />
            ) : (
              <div className="flex flex-col gap-2">
                {data.atributos.forcas.map(item => (
                  <div key={item.nome} className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#b0aea5] uppercase tracking-[0.08em] break-words">{item.nome}</span>
                      <span className="text-[10px] font-bold text-[#a8c47a] tabular-nums shrink-0 ml-2">{item.pct ?? 0}%</span>
                    </div>
                    <Bar pct={item.pct ?? 0} color="bg-[#a8c47a]/60" />
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle>Pontos de alerta</SectionTitle>
            {data.atributos.alertas.length === 0 ? (
              <Empty text="Nenhum atributo negativo em destaque." />
            ) : (
              <div className="flex flex-col gap-2">
                {data.atributos.alertas.map(item => (
                  <div key={item.nome} className="flex flex-col gap-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#b0aea5] uppercase tracking-[0.08em] break-words">{item.nome}</span>
                      <span className="text-[10px] font-bold text-[#d97757] tabular-nums shrink-0 ml-2">{item.pct ?? 0}%</span>
                    </div>
                    <Bar pct={item.pct ?? 0} color="bg-[#d97757]/60" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tendências (desativado por padrão) */}
      {b.tendencias && <Tendencias tendencias={data.tendencias} />}

      {/* Espectro Ideológico (desativado por padrão) */}
      {b.ideologia && data.ideologia && data.ideologia.length > 0 && (
        <MapaIdeologico ideologia={data.ideologia} />
      )}

      {/* Perfil Demográfico (desativado por padrão) */}
      {b.demografico && <PerfilDemografico demografico={data.demografico} />}

      {/* Força Regional */}
      {b.regional && data.origem && (
        <RegiaoComSaldo cidades={data.origem.cidades} />
      )}

      {/* Comparativo de Cargo (desativado por padrão) */}
      {b.cargo && data.comparativoCargo && (
        <ComparativoCargo comparativo={data.comparativoCargo} />
      )}

      {/* Aviso metodológico colapsável */}
      <div className="bg-[#141413] border border-[#3d3128]/70 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setMostrarAlerta(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-[8px] text-[#7a6e64] uppercase tracking-[0.18em] font-bold">Nota metodológica</span>
          <span className="text-[#7a6e64] text-xs">{mostrarAlerta ? '▲' : '▼'}</span>
        </button>
        {mostrarAlerta && (
          <p className="text-[9px] text-[#7a6e64] leading-relaxed px-4 pb-4 tracking-[0.08em]">
            {data.aviso}
          </p>
        )}
      </div>

    </div>
  );
};
