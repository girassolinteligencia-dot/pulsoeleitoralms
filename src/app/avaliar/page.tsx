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
import { Etapa5 } from '@/components/etapas/Etapa5';
import { EtapaCategoria, type Categoria } from '@/components/etapas/EtapaCategoria';
import { EtapaAprovacao } from '@/components/etapas/EtapaAprovacao';
import { EtapaExpectativa } from '@/components/etapas/EtapaExpectativa';
import { Etapa6 } from '@/components/etapas/Etapa6';
import { Fragmento } from '@/components/fragmento/Fragmento';

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
  const [config, setConfig] = useState<any>(null);
  
  const [userData, setUserData] = useState({
    ideologia: '',
    sexo: '',
    cor: '',
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
    loadConfig();
  }, []);

  const [categoria, setCategoria] = useState<Categoria>('politico');
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidato, setCandidato] = useState<Candidato | null>(null);
  const [orgaos, setOrgaos] = useState<OrgaoPublico[]>([]);
  const [orgao, setOrgao] = useState<OrgaoPublico | null>(null);
  const [servicos, setServicos] = useState<ServicoPublico[]>([]);
  const [servico, setServico] = useState<ServicoPublico | null>(null);

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

  const goToCategoriaStep = () => {
    if (needsRegionStep()) {
      setStep(3);
      return;
    }
    setStep(4);
  };

  const goToCandidateSearch = () => {
    setStep(5);
    if (categoria === 'orgao_publico') fetchOrgaos();
    else if (categoria === 'servico_publico') fetchServicos();
    else fetchCandidatos();
  };

  const fetchCandidatos = async (query: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/candidatos?${params.toString()}`);
      const data = await res.json();
      setCandidatos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setCandidatos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrgaos = async (query: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/orgaos?${params.toString()}`);
      const data = await res.json();
      setOrgaos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar órgãos:', error);
      setOrgaos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicos = async (query: string = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: query });
      const res = await fetch(`/api/servicos?${params.toString()}`);
      const data = await res.json();
      setServicos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      setServicos([]);
    } finally {
      setLoading(false);
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
      setStep(6);
    } catch {
      alert('Não foi possível iniciar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOrgaoSelect = async (org: OrgaoPublico) => {
    setLoading(true);
    try {
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
      setOrgao(org);
      setStep(6);
    } catch {
      alert('Não foi possível iniciar a avaliação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleServicoSelect = async (svc: ServicoPublico) => {
    setLoading(true);
    try {
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
      setServico(svc);
      setStep(6);
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
      setStep(5);
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
          setAdvancedResults(dataAdvanced);
        } catch {
          console.warn('Não foi possível carregar resultados');
          setResults([]);
        }
        setStep(9);
      } else {
        const errorData = await res.json().catch(() => ({}));
        console.error('Erro ao enviar avaliação:', errorData);
        alert('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
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
              <div className="relative w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 animate-pulse bg-[#d97757]/10 rounded-full blur-3xl scale-150" />
                <Fragmento id="sync-frag" label="" type="positivo" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[#d97757] font-display uppercase tracking-[0.5em] text-[10px] font-bold shadow-sm">
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
                <Etapa1
                  userData={userData} 
                  setUserData={setUserData as any} 
                  onNext={() => setStep(2)} 
                  config={config}
                />
              )}
              {step === 2 && (
                <Etapa2
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={goToCategoriaStep}
                  onBack={() => setStep(1)}
                  config={config}
                />
              )}
              {step === 3 && (
                <Etapa3
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={() => setStep(4)}
                  onBack={() => setStep(2)}
                  cidades={cidades}
                />
              )}
              {step === 4 && (
                <EtapaCategoria
                  onSelect={(cat) => { setCategoria(cat); goToCandidateSearch(); }}
                  onBack={() => needsRegionStep() ? setStep(3) : setStep(2)}
                />
              )}
              {step === 5 && categoria === 'politico' && (
                <Etapa4
                  candidatos={candidatos}
                  onSelect={handleCandidatoSelect}
                  onBack={() => setStep(4)}
                  onEditRegion={() => setStep(3)}
                  onSearch={fetchCandidatos}
                  regionLabel={[userData.bairro, userData.cidade, userData.uf || 'MS'].filter(Boolean).join(' • ')}
                />
              )}
              {step === 5 && categoria === 'orgao_publico' && (
                <Etapa4
                  candidatos={orgaos.map(o => ({
                    id: o.id,
                    nome: o.nome,
                    nomeExibido: o.nome,
                    cargo: o.tipo,
                    cidade: o.cidade,
                    foto_url: o.foto_url,
                    campanha: o.campanha,
                  }))}
                  onSelect={(item) => handleOrgaoSelect(orgaos.find(o => o.id === item.id)!)}
                  onBack={() => setStep(4)}
                  onEditRegion={() => setStep(3)}
                  onSearch={fetchOrgaos}
                  regionLabel={[userData.cidade, userData.uf || 'MS'].filter(Boolean).join(' • ')}
                  tituloBusca="Órgãos Públicos"
                  subtituloBusca="ÓRGÃOS DISPONÍVEIS"
                  placeholderBusca="Nome do órgão ou cidade..."
                />
              )}
              {step === 5 && categoria === 'servico_publico' && (
                <Etapa4
                  candidatos={servicos.map(s => ({
                    id: s.id,
                    nome: s.nome,
                    nomeExibido: s.nome,
                    cargo: s.tipo,
                    cidade: s.cidade,
                    foto_url: s.foto_url,
                    campanha: s.campanha,
                  }))}
                  onSelect={(item) => handleServicoSelect(servicos.find(s => s.id === item.id)!)}
                  onBack={() => setStep(4)}
                  onEditRegion={() => setStep(3)}
                  onSearch={fetchServicos}
                  regionLabel={[userData.cidade, userData.uf || 'MS'].filter(Boolean).join(' • ')}
                  tituloBusca="Serviços Públicos"
                  subtituloBusca="SERVIÇOS DISPONÍVEIS"
                  placeholderBusca="Nome do serviço ou cidade..."
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
              {step === 7 && (
                <EtapaAprovacao
                  onSelect={(val) => { setAprovacao(val); setStep(8); }}
                  onBack={() => setStep(6)}
                />
              )}
              {step === 8 && categoria === 'orgao_publico' && (
                <EtapaExpectativa
                  onSelect={(val) => { setExpectativaVitoria(val); submitEvaluation(aprovacao!, val); }}
                  onBack={() => setStep(7)}
                  titulo="Confiança Institucional"
                  pergunta="DE FORMA GERAL, VOCÊ CONFIA NO TRABALHO DESTE ÓRGÃO PÚBLICO?"
                  labelSim="Confio"
                  subLabelSim="Percepção de Credibilidade"
                  labelNao="Não Confio"
                  subLabelNao="Percepção de Descredito"
                />
              )}
              {step === 8 && categoria === 'servico_publico' && (
                <EtapaExpectativa
                  onSelect={(val) => { setExpectativaVitoria(val); submitEvaluation(aprovacao!, val); }}
                  onBack={() => setStep(7)}
                  titulo="Satisfação com o Serviço"
                  pergunta="DE FORMA GERAL, VOCÊ ESTÁ SATISFEITO COM ESTE SERVIÇO PÚBLICO?"
                  labelSim="Satisfeito"
                  subLabelSim="Percepção de Qualidade"
                  labelNao="Insatisfeito"
                  subLabelNao="Percepção de Falha"
                />
              )}
              {step === 8 && categoria === 'politico' && (
                <EtapaExpectativa
                  onSelect={(val) => { setExpectativaVitoria(val); submitEvaluation(aprovacao!, val); }}
                  onBack={() => setStep(7)}
                />
              )}
              {step === 9 && (
                <Etapa6
                  results={results}
                  advancedResults={advancedResults}
                  candidatoNome={candidato?.nomeExibido || candidato?.nome || ''}
                  candidatoFotoUrl={candidato?.foto_url}
                  onReset={() => window.location.reload()}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
