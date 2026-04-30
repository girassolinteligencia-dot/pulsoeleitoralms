'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGiroscopio } from '@/hooks/useGiroscopio';
import { Splash } from '@/components/ui/Splash';
import { Header } from '@/components/ui/Header';
import { Etapa1 } from '@/components/etapas/Etapa1';
import { Etapa2 } from '@/components/etapas/Etapa2';
import { Etapa3 } from '@/components/etapas/Etapa3';
import { Etapa4 } from '@/components/etapas/Etapa4';
import { Etapa5 } from '@/components/etapas/Etapa5';
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
  cargo: string;
  cidade: string;
  foto_url?: string;
  campanha?: {
    atributos: { atributo: Atributo }[];
  };
}

interface ResultData {
  atributo: string;
  valor: number;
  total: number;
}

export default function AvaliarPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [userData, setUserData] = useState({
    nome: '',
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

  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [candidato, setCandidato] = useState<Candidato | null>(null);

  const [evaluations, setEvaluations] = useState<{ atributoId: string; valor: number }[]>([]);
  const [results, setResults] = useState<ResultData[]>([]);
  const [honeypotValue, setHoneypotValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const startTimeRef = useRef<number>(0);
  
  const parallax = useGiroscopio();

  const cidades = ['Campo Grande', 'Dourados', 'Três Lagoas', 'Ponta Porã', 'Corumbá', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba'];
  
  const fetchCandidatos = async (query: string = '') => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/candidatos?cidade=${encodeURIComponent(userData.cidade)}&bairro=${encodeURIComponent(userData.bairro)}&search=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setCandidatos(lista);
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error);
      setCandidatos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCandidatoSelect = (cand: Candidato) => {
    startTimeRef.current = Date.now();
    setCandidato(cand);
    setStep(5);
  };

  const handleAttributeClick = (atributoId: string, valor: number) => {
    if (evaluations.find(e => e.atributoId === atributoId)) return;
    setEvaluations(prev => [...prev, { atributoId, valor }]);
  };

  const submitEvaluation = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const res = await fetch('/api/avaliar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidatoId: candidato?.id,
          avaliacoes: evaluations,
          fingerprint: 'fp_' + Math.random().toString(36).substr(2, 9),
          startTime: startTimeRef.current,
          endTime: Date.now(),
          honeypot: !!honeypotValue,
          perfil: userData
        })
      });

      if (res.ok) {
        // Try to fetch results, but don't block advancement if this fails
        try {
          const resResults = await fetch(`/api/resultados/${candidato?.id}`);
          const dataResults = await resResults.json();
          setResults(Array.isArray(dataResults) ? dataResults : []);
        } catch {
          console.warn('Não foi possível carregar resultados');
          setResults([]);
        }
        setStep(6);
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
                  {isSubmitting ? 'Ecoando sua Voz...' : 'Sincronizando Dados...'}
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
                  onNext={() => setStep(3)} 
                  onBack={() => setStep(1)} 
                  config={config}
                />
              )}
              {step === 3 && (
                <Etapa3 
                  userData={userData}
                  setUserData={setUserData as any}
                  onNext={() => { setStep(4); fetchCandidatos(); }}
                  onBack={() => setStep(2)}
                  cidades={cidades}
                />
              )}
              {step === 4 && (
                <Etapa4 
                  candidatos={candidatos}
                  onSelect={handleCandidatoSelect}
                  onBack={() => setStep(3)}
                  onSearch={fetchCandidatos}
                />
              )}
              {step === 5 && candidato && (
                <Etapa5 
                  candidato={candidato}
                  evaluations={evaluations}
                  onAttributeClick={handleAttributeClick}
                  onSubmit={submitEvaluation}
                  isSubmitting={isSubmitting}
                  parallax={parallax}
                  config={config}
                />
              )}
              {step === 6 && (
                <Etapa6 
                  results={results}
                  candidatoNome={candidato?.nome || ''}
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
