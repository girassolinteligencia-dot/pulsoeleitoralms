'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send } from 'lucide-react';

interface EtapaSugestaoProps {
  config?: any;
  onBack: () => void;
  onDone: () => void;
}

export const EtapaSugestao: React.FC<EtapaSugestaoProps> = ({ config, onBack, onDone }) => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoria, setCategoria] = useState('');
  const [nome, setNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const titulo = String(config?.sugestao_titulo || 'Não encontrou?');
  const subtitulo = String(config?.sugestao_subtitulo || 'Sugira um cadastro');
  const texto = String(config?.sugestao_texto || 'Se não encontrou o político, órgão ou serviço que queria avaliar, envie uma sugestão de cadastro.');

  useEffect(() => {
    fetch('/api/sugestao')
      .then(r => r.json())
      .then(d => setCategorias(d.categorias ?? []))
      .catch(() => setCategorias(['Político', 'Órgão Público', 'Serviço Público']));
  }, []);

  const ehPolitico = categoria === 'Político';
  const podeSalvar = !!categoria && !!nome.trim() && !!municipio.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeSalvar || enviando) return;
    setEnviando(true);
    setErro('');
    try {
      const res = await fetch('/api/sugestao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria, nome: nome.trim(), cargo: cargo.trim() || undefined, municipio: municipio.trim() }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setErro('Não foi possível enviar. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <motion.div
      className="relative z-10 w-full h-full flex flex-col items-center px-5 gap-5 overflow-y-auto pt-20 pb-safe no-scrollbar"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center shrink-0 max-w-sm">
        <h1 className="text-2xl font-bold font-display uppercase tracking-tight text-[#f5f0e8] drop-shadow-[0_0_15px_rgba(245,240,232,0.3)]">
          {titulo}
        </h1>
        <p className="text-[11px] text-[#b0aea5] uppercase tracking-[0.28em] mt-2 font-bold">
          {subtitulo}
        </p>
      </div>

      <p className="text-[11px] text-[#7a6e64] leading-relaxed text-center max-w-xs">
        {texto}
      </p>

      {enviado ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm flex flex-col items-center gap-5 py-8"
        >
          <div className="w-14 h-14 rounded-full bg-[#a8c47a]/15 border border-[#a8c47a]/30 flex items-center justify-center">
            <span className="text-[#a8c47a] text-xl">✓</span>
          </div>
          <p className="text-[11px] text-[#a8c47a] uppercase tracking-[0.22em] font-bold text-center">
            Sugestão enviada
          </p>
          <p className="text-[10px] text-[#7a6e64] text-center">
            Obrigado! Vamos analisar sua sugestão.
          </p>
          <button
            type="button"
            onClick={onDone}
            className="mt-4 px-10 py-4 rounded-full bg-[#d97757] text-[#f5f0e8] font-bold text-[9px] uppercase tracking-[0.32em] hover:brightness-110 transition-all"
          >
            Voltar ao início
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">

          {/* Categoria */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1">
              Categoria
            </label>
            <div className="flex flex-col gap-2">
              {categorias.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setCategoria(cat); if (cat !== 'Político') setCargo(''); }}
                  className={`w-full py-3.5 px-5 rounded-xl border text-[10px] font-bold uppercase tracking-wider text-left transition-all ${
                    categoria === cat
                      ? 'bg-[#d97757]/10 border-[#d97757] text-[#f5f0e8]'
                      : 'bg-[#1c1814]/50 border-[#3d3128] text-[#7a6e64] hover:border-[#7a6e64]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1">
              Nome
            </label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Nome completo ou nome de urna"
              className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8]"
            />
          </div>

          {/* Cargo — só para político */}
          {ehPolitico && (
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1">
                Cargo <span className="text-[#7a6e64] normal-case tracking-normal font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={cargo}
                onChange={e => setCargo(e.target.value)}
                placeholder="Ex: Deputado Federal, Prefeito…"
                className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8]"
              />
            </div>
          )}

          {/* Município */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase font-bold text-[#d97757] tracking-widest ml-1">
              Município
            </label>
            <input
              type="text"
              value={municipio}
              onChange={e => setMunicipio(e.target.value)}
              placeholder="Cidade de atuação"
              className="w-full bg-[#1c1814]/80 border border-[#3d3128] rounded-xl px-5 py-4 text-sm focus:outline-none focus:border-[#d97757] transition-all placeholder:text-[#7a6e64]/50 text-[#f5f0e8]"
            />
          </div>

          {erro && (
            <p className="text-[10px] text-[#d97757] text-center">{erro}</p>
          )}

          <button
            type="submit"
            disabled={!podeSalvar || enviando}
            className={`w-full py-4 rounded-full font-bold text-[9px] uppercase tracking-[0.32em] flex items-center justify-center gap-2 transition-all ${
              podeSalvar
                ? 'bg-[#d97757] text-[#f5f0e8] hover:brightness-110 shadow-xl'
                : 'bg-[#1c1814] text-[#7a6e64] border border-[#3d3128] opacity-40 cursor-not-allowed'
            }`}
          >
            <Send size={13} />
            {enviando ? 'Enviando…' : 'Enviar sugestão'}
          </button>
        </form>
      )}

      {!enviado && (
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-2 text-[9px] uppercase font-bold text-[#7a6e64] tracking-[0.24em] hover:text-[#f5f0e8] transition-colors"
        >
          <ArrowLeft size={13} />
          Voltar
        </button>
      )}
    </motion.div>
  );
};
