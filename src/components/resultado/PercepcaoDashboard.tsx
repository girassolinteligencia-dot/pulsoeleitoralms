'use client';

import React from 'react';
interface IndicadorItem {
  nome: string;
  total: number;
  pct?: number;
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
  origem: {
    cidades: IndicadorItem[];
    bairros: IndicadorItem[];
  };
  aviso: string;
}

interface PercepcaoDashboardProps {
  data: PercepcaoData | null;
}

function RankedList({ title, items, empty, color }: { title: string; items: IndicadorItem[]; empty: string; color: string }) {
  return (
    <section className="bg-[#1c1814] border border-[#3d3128] rounded-xl p-4 flex flex-col gap-4">
      <span className="text-[9px] uppercase tracking-[0.18em] text-[#f5f0e8] font-bold leading-relaxed">{title}</span>
      {items.length > 0 ? (
        <div className="flex flex-col gap-3">
          {items.map((item, index) => (
            <div key={`${item.nome}-${index}`} className="flex items-start justify-between gap-4">
              <span className="text-[10px] text-[#b0aea5] uppercase tracking-[0.1em] leading-relaxed break-words">{item.nome}</span>
              <span className={`text-[10px] font-bold tabular-nums ${color}`}>{item.pct ?? item.total}%</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-[#7a6e64] leading-relaxed">{empty}</p>
      )}
    </section>
  );
}

export const PercepcaoDashboard: React.FC<PercepcaoDashboardProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-5 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[#7a6e64] font-bold">
          Consolidando dados da percepção...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3 pb-12">
      <RankedList
        title="Principais forças percebidas"
        items={data.atributos.forcas}
        empty="Ainda não há atributos positivos suficientes para destacar."
        color="text-[#a8c47a]"
      />

      <div className="grid grid-cols-1 gap-3">
        <RankedList
          title="Cidades das vozes"
          items={data.origem.cidades}
          empty="Cidade do respondente ainda não disponível em volume suficiente."
          color="text-[#c8933a]"
        />
        <RankedList
          title="Bairros das vozes"
          items={data.origem.bairros}
          empty="Bairro do respondente ainda não disponível em volume suficiente."
          color="text-[#c8933a]"
        />
      </div>

      <div className="bg-[#141413] border border-[#3d3128]/70 rounded-xl p-4">
        <p className="text-[9px] text-[#7a6e64] leading-relaxed uppercase tracking-[0.12em]">
          {data.aviso}
        </p>
      </div>
    </div>
  );
};
