'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGiroscopio } from '@/hooks/useGiroscopio';
import { Splash } from '@/components/ui/Splash';
import { Header } from '@/components/ui/Header';
import { Etapa0 } from '@/components/etapas/Etapa0';
import { Etapa1 } from '@/components/etapas/Etapa1';
import { Etapa2 } from '@/components/etapas/Etapa2';
import { Etapa3 } from '@/components/etapas/Etapa3';
import { Etapa4 } from '@/components/etapas/Etapa4';
import { EtapaDestaque, type EntidadeDestaque } from '@/components/etapas/EtapaDestaque';
import { Etapa5 } from '@/components/etapas/Etapa5';
import { EtapaCategoria, type Categoria } from '@/components/etapas/EtapaCategoria';
import { EtapaFinal } from '@/components/etapas/EtapaFinal';
import { Etapa6 } from '@/components/etapas/Etapa6';
import { EtapaSugestao } from '@/components/etapas/EtapaSugestao';
import { Fragmento } from '@/components/fragmento/Fragmento';
import { PulsoEfeito } from '@/components/ui/PulsoEfeito';

interface Atributo {
  id: string;
  nome: string;
  polaridade: number;
}

interface Candidato {
  id: string;
  nome: string;
  nomeExibido: string;
  partido?: string;
  cargo: string;
  cidade: string;
  foto_url?: string;
  campanha?: {
    atributos: { atributo: Atributo }[];
  };
}

interface EntidadeAvaliavel {
  id: string;
  nome: string;
  tipo: string;
  cidade: string;
  uf: string;
  foto_url?: string;
  campanha?: {
    atributos: { atributo: Atributo }[];
  };
}

type OrgaoPublico = EntidadeAvaliavel;
type ServicoPublico = EntidadeAvaliavel;

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

export default function AvaliarPage() {
  const [showSplash, setShowSplash] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [userData, setUserData] = useState({
    ideologia: '',
    sexo: '',
    cor: '',
    faixaEtaria: '',
    escolaridade: '',
    estadoCivil: '',
    faixaSalarial: '',
    religiao: '',
    ocupacao: '',
    filhos: '',
    orientacaoSexual: '',
    deficiencia: '',
    tempoResidencia: '',
    cidade: '',
    bairro: '',
    uf: '',
    localidadeOrigem: '',
    bairrosPossiveis: [] as { bairro: string; registros?: number; proporcao?: number }[],
    bairroConfianca: null as number | null,
    precisaConfirmarBairro: false,
  });

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/configuracoes/public');
        const data = await res.json();
        setConfig(data);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    const loadDestaques = async () => {
      try {
        const res = await fetch('/api/public/destaques');
        const data = await res.json();
        setDestaquesOrgaos(data.orgaos ?? []);
        setDestaquesServicos(data.servicos ?? []);
      } catch {
        // destaques são opcionais — cai para busca normal
      }
    };
    loadConfig();
    loadDestaques();
  }, []);

  const [categoria, setCategoria] = useState<Categoria>('politico');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [orgaos, setOrgaos] = useState<OrgaoPublico[]>([]);
  const [orgao, setOrgao] = useState<OrgaoPublico | null>(null);
  const [servicos, setServicos] = useState<ServicoPublico[]>([]);
  const [servico, setServico] = useState<ServicoPublico | null>(null);
  const [destaquesOrgaos, setDestaquesOrgaos] = useState<EntidadeDestaque[]>([]);
  const [destaquesServicos, setDestaquesServicos] = useState<EntidadeDestaque[]>([]);

  const [evaluations, setEvaluations] = useState<{ atributoId: string; valor: number }[]>([]);
  const [aprovacao, setAprovacao] = useState<boolean | null>(null);
  const [expectativaVitoria, setExpectativaVitoria] = useState<boolean | null>(null);
  const [results, setResults] = useState<ResultData[]>([]);
  const [advancedResults, setAdvancedResults] = useState<any>(null);
  const [honeypotValue, setHoneypotValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const fingerprintRef = useRef('');
  
  const parallax = useGiroscopio();

  const getFingerprint = () => {
    if (!fingerprintRef.current) {
      fingerprintRef.current = `fp_${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}`;
    }

    return fingerprintRef.current;
  };

  const cidades = ['Campo Grande', 'Dourados', 'Três Lagoas', 'Ponta Porã', 'Corumbá', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba'];

  const needsRegionStep = () => (
    !userData.cidade ||
    !userData.bairro ||
    userData.precisaConfirmarBairro ||
    userData.localidadeOrigem === 'manual_pendente'
  );

  const goToEntitySearch = (cat: Categoria) => {
    setStep(2);
    if (cat === 'orgao_publico') fetchOrgaos();
    else if (cat === 'servico_publico') fetchServicos();
    // políticos: não pré-carrega — usuário deve digitar e buscar
  };

  const goToAttributesAfterProfile = () => {
    if (needsRegionStep()) {
      setStep(5);
    } else {
      setStep(6);
    }
  };

  const fetchCandidatos = async (query: string = '') => {
    setLoadingBusca(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/candidatos?${params.toString()}`);
      const data = await res.json();
      setCandidatos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setCandidatos([]);
    } finally {
      setLoadingBusca(false);
    }
  };

  const fetchOrgaos = async (query: string = '') => {
    setLoadingBusca(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/orgaos?${params.toString()}`);
      const data = await res.json();
      setOrgaos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar órgãos:', error);
      setOrgaos([]);
    } finally {
      setLoadingBusca(false);
    }
  };

  const fetchServicos = async (query: string = '') => {
    setLoadingBusca(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/servicos?${params.toString()}`);
      const data = await res.json();
      setServicos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setServicos([]);
    } finally {
      setLoadingBusca(false);
    }
  };

  const handleCandidatoSelect = async (cand: Candidato) => {
    setLoading(true);
    try {
      const res = await fetch('/api/avaliar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatoId: cand.id, fingerprint: getFingerprint() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionToken(data.token);
      setEvaluations([]);
      setOrgao(null); setServico(null);
      setCandidato(cand);
      setStep(3);
    } catch {
      alert('Não foi possível iniciar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgaoSelect = async (org: OrgaoPublico) => {
    setLoading(true);
    try {
      // Se veio do destaque (sem campanha/atributos), buscar dados completos
      let orgaoCompleto: OrgaoPublico = org;
      if (!org.campanha) {
        const listaAtual = orgaos.find(o => o.id === org.id);
        if (listaAtual) {
          orgaoCompleto = listaAtual;
        } else {
          const res2 = await fetch(`/api/orgaos?search=`);
          const lista: OrgaoPublico[] = await res2.json();
          setOrgaos(lista);
          orgaoCompleto = lista.find(o => o.id === org.id) ?? org;
        }
      }

      const res = await fetch('/api/avaliar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgaoId: org.id, fingerprint: getFingerprint() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionToken(data.token);
      setEvaluations([]);
      setCandidato(null); setServico(null);
      setOrgao(orgaoCompleto);
      setStep(3);
    } catch {
      alert('Não foi possível iniciar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleServicoSelect = async (svc: ServicoPublico) => {
    setLoading(true);
    try {
      // Se veio do destaque (sem campanha/atributos), buscar dados completos
      let servicoCompleto: ServicoPublico = svc;
      if (!svc.campanha) {
        const listaAtual = servicos.find(s => s.id === svc.id);
        if (listaAtual) {
          servicoCompleto = listaAtual;
        } else {
          const res2 = await fetch(`/api/servicos?search=`);
          const lista: ServicoPublico[] = await res2.json();
          setServicos(lista);
          servicoCompleto = lista.find(s => s.id === svc.id) ?? svc;
        }
      }

      const res = await fetch('/api/avaliar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicoId: svc.id, fingerprint: getFingerprint() }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSessionToken(data.token);
      setEvaluations([]);
      setCandidato(null); setOrgao(null);
      setServico(servicoCompleto);
      setStep(3);
    } catch {
      alert('Não foi possível iniciar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttributeClick = (atributoId: string, valor: number) => {
    setEvaluations(prev => {
      const exists = prev.find(e => e.atributoId === atributoId);
      if (exists) {
        return prev.filter(e => e.atributoId !== atributoId);
      }
      return [...prev, { atributoId, valor }];
    });
  };


  const submitEvaluation = async (finalAprovacao?: boolean, finalExpectativa?: boolean) => {
    if (isSubmitting) return;
    if (!sessionToken) {
      alert('Sessão de avaliação expirada. Selecione o candidato novamente.');
      setStep(2);
      return;
    }
    setIsSubmitting(true);

    const curAprovacao = finalAprovacao !== undefined ? finalAprovacao : aprovacao;
    const curExpectativa = finalExpectativa !== undefined ? finalExpectativa : expectativaVitoria;
    const perfilManifestacao = {
      ideologia: userData.ideologia,
      sexo: userData.sexo,
      cor: userData.cor,
      escolaridade: userData.escolaridade,
      estadoCivil: userData.estadoCivil,
      faixaSalarial: userData.faixaSalarial,
      religiao: userData.religiao,
      ocupacao: userData.ocupacao,
      filhos: userData.filhos,
      orientacaoSexual: userData.orientacaoSexual,
      deficiencia: userData.deficiencia,
      tempoResidencia: userData.tempoResidencia,
      cidade: userData.cidade,
      bairro: userData.bairro,
      uf: userData.uf || 'MS',
      localidadeOrigem: userData.localidadeOrigem || 'manual',
      bairroConfianca: userData.bairroConfianca,
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const entityPayload = orgao
        ? { orgaoId: orgao.id }
        : servico
        ? { servicoId: servico.id }
        : { candidatoId: candidato?.id };

      const res = await fetch('/api/avaliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entityPayload,
          avaliacoes: evaluations,
          fingerprint: getFingerprint(),
          sessionToken,
          honeypot: !!honeypotValue,
          perfil: perfilManifestacao,
          aprovacao: curAprovacao,
          expectativaVitoria: curExpectativa,
        }),
      });

      if (res.ok) {
        try {
          const baseUrl = orgao
            ? `/api/resultados/orgao/${orgao.id}`
            : servico
            ? `/api/resultados/servico/${servico.id}`
            : `/api/resultados/${candidato?.id}`;
          const resResults = await fetch(baseUrl);
          const dataResults = await resResults.json();
          setResults(Array.isArray(dataResults) ? dataResults : []);

          const resAdvanced = await fetch(`${baseUrl}/percepcao`);
          const dataAdvanced = await resAdvanced.json();
          // Só aceita se tiver a estrutura mínima esperada pelo PercepcaoDashboard
          setAdvancedResults(dataAdvanced?.leitura && dataAdvanced?.resumo ? dataAdvanced : null);
        } catch {
          console.warn('Não foi possível carregar resultados');
          setResults([]);
        }
        setStep(8);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('[submitEvaluation] erro da API:', res.status, errorData);
        alert(`Ocorreu um erro ao enviar sua avaliação. Tente novamente.\n\n${errorData.error || res.status}`);
      }
    } catch (error) {
      console.error('Erro de conexão:', error);
      alert('Erro de conexão. Verifique sua internet e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSplash) return <Splash onComplete={() => setShowSplash(false)} />;

  return (
    <main className="relative w-full h-[100svh] overflow-hidden bg-[#141413] text-[#f5f0e8] flex flex-col items-center">
      <Header />

      {/* Honeypot Anti-robô */}
      <div className="opacity-0 absolute pointer-events-none -z-50">
        <input 
          type="text" 
          value={honeypotValue} 
          onChange={(e) => setHoneypotValue(e.target.value)} 
          tabIndex={-1} 
          autoComplete="off" 
          title="security-field"
        />
      </div>

      {/* Camada 3: Fundo Dinâmico (Parallax) */}
      <div 
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          transform: `translate(${parallax.x * 12}px, ${parallax.y * 12}px) scale(1.1)`,
          background: 'radial-gradient(circle at 50% 50%, #2e251d 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col pt-safe pb-safe px-safe overflow-hidden">
        <AnimatePresence mode="wait">
          {loading || isSubmitting ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full flex flex-col items-center justify-center gap-8 px-6"
            >
              <PulsoEfeito />
              <div className="flex flex-col items-center gap-2">
                <span className="text-[#d97757] font-display uppercase tracking-[0.5em] text-[11px] font-bold">
                  {isSubmitting ? 'Registrando seu Pulso...' : 'Sincronizando Dados...'}
                </span>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full bg-[#d97757]"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {step === 0 && (
                <Etapa0
                  onNext={() => setStep(1)}
                />
              )}
              {step === 1 && (
                <EtapaCategoria
                  onSelect={(cat) => { setCategoria(cat); goToEntitySearch(cat); }}
                  onBack={() => setStep(0)}
                />
              )}
              {step === 2 && categoria === 'politico' && (
                <Etapa4
                  candidatos={candidatos}
                  onSelect={handleCandidatoSelect}
                  onBack={() => setStep(1)}
                  onEditRegion={() => setStep(5)}
                  onSearch={fetchCandidatos}
                  onSugestao={() => setStep(9)}
                  buscando={loadingBusca}
                  regionLabel={[userData.bairro, userData.cidade, userData.uf || 'MS'].filter(Boolean).join(' • ')}
                />
              )}
              {step === 2 && categoria === 'orgao_publico' && (
                <EtapaDestaque
                  key="destaque-orgao"
                  categoria="orgao_publico"
                  destaques={destaquesOrgaos}
                  resultadosBusca={orgaos.map(o => ({ id: o.id, nome: o.nome, tipo: o.tipo, cidade: o.cidade, foto_url: o.foto_url }))}
                  buscando={loadingBusca}
                  onSelect={(ent) => handleOrgaoSelect(orgaos.find(o => o.id === ent.id) ?? ent as OrgaoPublico)}
                  onSearch={fetchOrgaos}
                  onBack={() => setStep(1)}
                  onSugestao={() => setStep(9)}
                />
              )}
              {step === 2 && categoria === 'servico_publico' && (
                <EtapaDestaque
                  key="destaque-servico"
                  categoria="servico_publico"
                  destaques={destaquesServicos}
                  resultadosBusca={servicos.map(s => ({ id: s.id, nome: s.nome, tipo: s.tipo, cidade: s.cidade, foto_url: s.foto_url }))}
                  buscando={loadingBusca}
                  onSelect={(ent) => handleServicoSelect(servicos.find(s => s.id === ent.id) ?? ent as ServicoPublico)}
                  onSearch={fetchServicos}
                  onBack={() => setStep(1)}
                  onSugestao={() => setStep(9)}
                />
              )}
              {step === 3 && (
                <Etapa1
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={() => setStep(4)}
                  config={config}
                />
              )}
              {step === 4 && (
                <Etapa2
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={goToAttributesAfterProfile}
                  onBack={() => setStep(3)}
                  config={config}
                />
              )}
              {step === 5 && (
                <Etapa3
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={() => setStep(6)}
                  onBack={() => setStep(4)}
                  cidades={cidades}
                />
              )}
              {step === 6 && (candidato || orgao || servico) && (
                <Etapa5
                  key={candidato?.id ?? orgao?.id ?? servico?.id}
                  candidato={candidato ?? (orgao ? {
                    id: orgao.id,
                    nome: orgao.nome,
                    nomeExibido: orgao.nome,
                    cargo: orgao.tipo,
                    cidade: orgao.cidade,
                    foto_url: orgao.foto_url,
                    campanha: orgao.campanha,
                  } : {
                    id: servico!.id,
                    nome: servico!.nome,
                    nomeExibido: servico!.nome,
                    cargo: servico!.tipo,
                    cidade: servico!.cidade,
                    foto_url: servico!.foto_url,
                    campanha: servico!.campanha,
                  })}
                  evaluations={evaluations}
                  onAttributeClick={handleAttributeClick}
                  onNext={() => setStep(7)}
                  isSubmitting={isSubmitting}
                  parallax={parallax}
                  config={config}
                />
              )}
              {step === 7 && categoria === 'politico' && (
                <EtapaFinal
                  aprovacaoConfig={{
                    titulo: String(config?.etapafinal_politico_aprov_titulo || 'Postura Pública'),
                    pergunta: String(config?.etapafinal_politico_aprov_pergunta || 'DE FORMA GERAL, VOCÊ APROVA OU DESAPROVA A IMAGEM DESTE CANDIDATO?'),
                    labelSim: String(config?.etapafinal_politico_aprov_sim || 'Aprovo'),
                    labelNao: String(config?.etapafinal_politico_aprov_nao || 'Desaprovo'),
                  }}
                  expectativaConfig={{
                    titulo: String(config?.etapafinal_politico_exp_titulo || 'Poder de Vitória'),
                    pergunta: String(config?.etapafinal_politico_exp_pergunta || 'INDEPENDENTE DO SEU VOTO, VOCÊ ACREDITA QUE ESTE CANDIDATO TEM FORÇA PARA VENCER?'),
                    labelSim: String(config?.etapafinal_politico_exp_sim || 'Tem Força'),
                    subLabelSim: String(config?.etapafinal_politico_exp_sublabelsim || 'Percepção de Protagonismo'),
                    labelNao: String(config?.etapafinal_politico_exp_nao || 'Sem Força'),
                    subLabelNao: String(config?.etapafinal_politico_exp_sublabelnao || 'Percepção de Figurante'),
                  }}
                  onSubmit={(aprov, expect) => { setAprovacao(aprov); setExpectativaVitoria(expect); submitEvaluation(aprov, expect); }}
                  onBack={() => setStep(6)}
                />
              )}
              {step === 7 && categoria === 'orgao_publico' && (
                <EtapaFinal
                  aprovacaoConfig={{
                    titulo: String(config?.etapafinal_orgao_aprov_titulo || 'Avaliação Geral'),
                    pergunta: String(config?.etapafinal_orgao_aprov_pergunta || 'DE FORMA GERAL, VOCÊ AVALIA POSITIVA OU NEGATIVAMENTE A ATUAÇÃO DESTE ÓRGÃO?'),
                    labelSim: String(config?.etapafinal_orgao_aprov_sim || 'Positiva'),
                    labelNao: String(config?.etapafinal_orgao_aprov_nao || 'Negativa'),
                  }}
                  expectativaConfig={{
                    titulo: String(config?.etapafinal_orgao_exp_titulo || 'Confiança Institucional'),
                    pergunta: String(config?.etapafinal_orgao_exp_pergunta || 'DE FORMA GERAL, VOCÊ CONFIA NO TRABALHO DESTE ÓRGÃO PÚBLICO?'),
                    labelSim: String(config?.etapafinal_orgao_exp_sim || 'Confio'),
                    subLabelSim: String(config?.etapafinal_orgao_exp_sublabelsim || 'Percepção de Credibilidade'),
                    labelNao: String(config?.etapafinal_orgao_exp_nao || 'Não Confio'),
                    subLabelNao: String(config?.etapafinal_orgao_exp_sublabelnao || 'Percepção de Descredito'),
                  }}
                  onSubmit={(aprov, expect) => { setAprovacao(aprov); setExpectativaVitoria(expect); submitEvaluation(aprov, expect); }}
                  onBack={() => setStep(6)}
                />
              )}
              {step === 7 && categoria === 'servico_publico' && (
                <EtapaFinal
                  aprovacaoConfig={{
                    titulo: String(config?.etapafinal_servico_aprov_titulo || 'Avaliação Geral'),
                    pergunta: String(config?.etapafinal_servico_aprov_pergunta || 'DE FORMA GERAL, VOCÊ AVALIA POSITIVA OU NEGATIVAMENTE ESTE SERVIÇO PÚBLICO?'),
                    labelSim: String(config?.etapafinal_servico_aprov_sim || 'Positiva'),
                    labelNao: String(config?.etapafinal_servico_aprov_nao || 'Negativa'),
                  }}
                  expectativaConfig={{
                    titulo: String(config?.etapafinal_servico_exp_titulo || 'Satisfação com o Serviço'),
                    pergunta: String(config?.etapafinal_servico_exp_pergunta || 'DE FORMA GERAL, VOCÊ ESTÁ SATISFEITO COM ESTE SERVIÇO PÚBLICO?'),
                    labelSim: String(config?.etapafinal_servico_exp_sim || 'Satisfeito'),
                    subLabelSim: String(config?.etapafinal_servico_exp_sublabelsim || 'Percepção de Qualidade'),
                    labelNao: String(config?.etapafinal_servico_exp_nao || 'Insatisfeito'),
                    subLabelNao: String(config?.etapafinal_servico_exp_sublabelnao || 'Percepção de Falha'),
                  }}
                  onSubmit={(aprov, expect) => { setAprovacao(aprov); setExpectativaVitoria(expect); submitEvaluation(aprov, expect); }}
                  onBack={() => setStep(6)}
                />
              )}
              {step === 8 && (
                <Etapa6
                  results={results}
                  advancedResults={advancedResults}
                  userEvaluations={evaluations}
                  candidatoNome={
                    orgao?.nome || servico?.nome ||
                    candidato?.nomeExibido || candidato?.nome || ''
                  }
                  candidatoFotoUrl={orgao?.foto_url || servico?.foto_url || candidato?.foto_url}
                  onReset={() => window.location.reload()}
                  config={config}
                />
              )}
              {step === 9 && (
                <EtapaSugestao
                  config={config}
                  onBack={() => setStep(2)}
                  onDone={() => window.location.reload()}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
