import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-morphism border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 relative overflow-hidden rounded-xl shadow-2xl border border-white/10">
              <Image
                src="/logo.png"
                alt="Pulso Eleitoral"
                fill
                className="object-cover"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Pulso <span className="text-primary">Eleitoral</span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-text-muted">
            <a href="#about" className="hover:text-primary transition-colors">Manifesto</a>
            <a href="#methodology" className="hover:text-primary transition-colors">Metodologia</a>
            <a href="#results" className="hover:text-primary transition-colors">Dados</a>
            <button className="px-6 py-2.5 rounded-xl bg-primary text-foreground font-semibold hover:bg-accent transition-all shadow-xl shadow-primary/10">
              Participar
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col pt-20">
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
          {/* Subtle Warm Glows */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[10%] left-[15%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[140px]" />
            <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-text-muted text-xs font-medium mb-12">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Uma iniciativa para a transparência democrática
            </div>
            
            <h1 className="text-6xl md:text-8xl font-title font-bold tracking-tight mb-10 leading-[1.05] text-foreground">
              Onde a voz do <br />
              <span className="italic font-serif text-primary">povo</span> se torna dado.
            </h1>
            
            <p className="text-xl md:text-2xl font-body text-text-muted max-w-2xl mx-auto mb-16 leading-relaxed">
              Pulso Eleitoral é uma plataforma independente dedicada a capturar o sentimento genuíno do eleitorado através de tecnologia auditável e diálogos transparentes.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary text-foreground font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/20">
                Acompanhar Pulso
              </button>
              <button className="w-full sm:w-auto px-10 py-5 rounded-2xl clay-surface font-bold text-lg hover:bg-white/5 transition-all text-foreground">
                Nossa Missão
              </button>
            </div>
          </div>
        </section>

        {/* Editorial Section / Stats */}
        <section className="py-32 border-y border-white/5 bg-[#1a1a18]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              {[
                { title: "Independência", desc: "Sem vínculos partidários ou coalizões institucionais. Nossa única lealdade é com a verdade dos dados." },
                { title: "Auditabilidade", desc: "Cada voto e sentimento coletado passa por processos de verificação criptográfica e estatística." },
                { title: "Humanidade", desc: "Traduzimos números complexos em narrativas compreensíveis que refletem a realidade brasileira." },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col gap-4">
                  <div className="w-12 h-1 bg-primary/40 mb-2" />
                  <h3 className="text-2xl font-title text-foreground">{feature.title}</h3>
                  <p className="font-body text-text-muted leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 bg-background text-center">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <div className="text-xl font-bold tracking-tight text-foreground opacity-60">
            Pulso <span className="text-primary">Eleitoral</span>
          </div>
          <p className="font-body text-text-muted text-sm max-w-md">
            Promovendo o diálogo e a clareza informacional no processo democrático sul-mato-grossense.
          </p>
          <div className="h-px w-20 bg-white/10" />
          <p className="text-xs text-text-muted/40 uppercase tracking-widest">
            © 2026 • Plataforma Independente • MS
          </p>
        </div>
      </footer>
    </div>
  );
}
