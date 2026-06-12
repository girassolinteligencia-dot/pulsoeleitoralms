import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

const prisma = new PrismaClient();

const ATRIBUTOS: Array<{ nome: string; descricao: string; polaridade: number; categoria: string }> = [
  // ── Políticos — positivos ──────────────────────────────────────────────────
  { nome: 'Ficha Limpa',         descricao: 'Histórico político sem condenações.',                       polaridade:  1, categoria: 'politico' },
  { nome: 'Experiência',         descricao: 'Vivência e histórico em gestão pública.',                   polaridade:  1, categoria: 'politico' },
  { nome: 'Propostas Claras',    descricao: 'Plano de governo objetivo e viável.',                       polaridade:  1, categoria: 'politico' },
  { nome: 'Liderança',           descricao: 'Capacidade de mobilizar e guiar a comunidade.',             polaridade:  1, categoria: 'politico' },
  { nome: 'Diálogo',             descricao: 'Abertura para ouvir a população e oposição.',               polaridade:  1, categoria: 'politico' },
  { nome: 'Inovação',            descricao: 'Busca por novas soluções e tecnologias.',                   polaridade:  1, categoria: 'politico' },
  { nome: 'Transparência',       descricao: 'Clareza e acesso aos dados públicos.',                      polaridade:  1, categoria: 'politico' },
  { nome: 'Compromisso Social',  descricao: 'Atenção às causas sociais e bem-estar coletivo.',           polaridade:  1, categoria: 'politico' },
  { nome: 'Empatia',             descricao: 'Capacidade de entender e sentir a dor do outro.',           polaridade:  1, categoria: 'politico' },
  { nome: 'Conhecimento Técnico',descricao: 'Domínio sobre administração e políticas públicas.',         polaridade:  1, categoria: 'politico' },
  { nome: 'Honestidade',         descricao: 'Integridade e retidão na conduta pública.',                 polaridade:  1, categoria: 'politico' },
  { nome: 'Foco em Resultados',  descricao: 'Orientação para entregas e efetividade.',                   polaridade:  1, categoria: 'politico' },
  { nome: 'Visão de Futuro',     descricao: 'Planejamento a longo prazo.',                               polaridade:  1, categoria: 'politico' },
  { nome: 'Sustentabilidade',    descricao: 'Preocupação com o meio ambiente.',                          polaridade:  1, categoria: 'politico' },
  { nome: 'Ética Profissional',  descricao: 'Conduta moral no ambiente de trabalho.',                    polaridade:  1, categoria: 'politico' },

  // ── Políticos — negativos ──────────────────────────────────────────────────
  { nome: 'Promessas Vazias',    descricao: 'Falar sem cumprir ou sem viabilidade.',                     polaridade: -1, categoria: 'politico' },
  { nome: 'Inexperiência',       descricao: 'Falta de conhecimento em gestão pública.',                  polaridade: -1, categoria: 'politico' },
  { nome: 'Radicalismo',         descricao: 'Postura extrema e aversão ao diálogo.',                     polaridade: -1, categoria: 'politico' },
  { nome: 'Falta de Ética',      descricao: 'Comportamento imoral ou inadequado.',                       polaridade: -1, categoria: 'politico' },
  { nome: 'Oportunismo',         descricao: 'Aproveitar-se de situações para ganho próprio.',            polaridade: -1, categoria: 'politico' },
  { nome: 'Negligência',         descricao: 'Omissão no cuidado com a coisa pública.',                   polaridade: -1, categoria: 'politico' },
  { nome: 'Autoritarismo',       descricao: 'Imposição de vontades sem consultar o povo.',               polaridade: -1, categoria: 'politico' },
  { nome: 'Incoerência',         descricao: 'Contradição entre discurso e prática.',                     polaridade: -1, categoria: 'politico' },
  { nome: 'Populismo',           descricao: 'Medidas imediatistas apenas para ganhar apoio.',            polaridade: -1, categoria: 'politico' },
  { nome: 'Nepotismo',           descricao: 'Favorecimento de familiares e amigos.',                     polaridade: -1, categoria: 'politico' },
  { nome: 'Falta de Preparo',    descricao: 'Desconhecimento dos problemas reais da cidade.',            polaridade: -1, categoria: 'politico' },
  { nome: 'Arrogância',          descricao: 'Soberba e distanciamento do eleitor.',                      polaridade: -1, categoria: 'politico' },
  { nome: 'Desorganização',      descricao: 'Gestão caótica e sem planejamento.',                        polaridade: -1, categoria: 'politico' },
  { nome: 'Manipulação',         descricao: 'Uso de mentiras para enganar a população.',                 polaridade: -1, categoria: 'politico' },

  // ── Órgãos Públicos — positivos ────────────────────────────────────────────
  { nome: 'Eficiência Administrativa',   descricao: 'Realiza suas atividades de forma organizada e produtiva.',                  polaridade:  1, categoria: 'orgao' },
  { nome: 'Transparência Institucional', descricao: 'Disponibiliza informações de maneira acessível e compreensível.',           polaridade:  1, categoria: 'orgao' },
  { nome: 'Confiabilidade',              descricao: 'Gera segurança quanto ao cumprimento de suas atribuições.',                 polaridade:  1, categoria: 'orgao' },
  { nome: 'Organização',                 descricao: 'Possui processos claros e bem estruturados.',                              polaridade:  1, categoria: 'orgao' },
  { nome: 'Agilidade',                   descricao: 'Responde e atua em tempo adequado.',                                       polaridade:  1, categoria: 'orgao' },
  { nome: 'Prestação de Contas',         descricao: 'Demonstra resultados e ações de forma compreensível.',                     polaridade:  1, categoria: 'orgao' },
  { nome: 'Acessibilidade',              descricao: 'Facilita o acesso da população aos seus serviços e informações.',          polaridade:  1, categoria: 'orgao' },
  { nome: 'Capacidade Técnica',          descricao: 'Demonstra preparo para executar suas competências institucionais.',        polaridade:  1, categoria: 'orgao' },

  // ── Órgãos Públicos — negativos ────────────────────────────────────────────
  { nome: 'Burocracia Excessiva',        descricao: 'Processos lentos e desnecessariamente complexos.',                         polaridade: -1, categoria: 'orgao' },
  { nome: 'Falta de Transparência',      descricao: 'Dificuldade de acesso a informações públicas.',                            polaridade: -1, categoria: 'orgao' },
  { nome: 'Desorganização Institucional',descricao: 'Processos confusos e mal estruturados.',                                   polaridade: -1, categoria: 'orgao' },
  { nome: 'Ineficiência',                descricao: 'Baixa produtividade e desperdício de recursos.',                           polaridade: -1, categoria: 'orgao' },
  { nome: 'Inacessibilidade',            descricao: 'Dificuldade para a população acessar serviços e informações.',             polaridade: -1, categoria: 'orgao' },
  { nome: 'Omissão Institucional',       descricao: 'Descumprimento de obrigações e responsabilidades.',                       polaridade: -1, categoria: 'orgao' },
  { nome: 'Despreparo Técnico',          descricao: 'Falta de capacitação para executar as funções institucionais.',            polaridade: -1, categoria: 'orgao' },
  { nome: 'Descaso com o Cidadão',       descricao: 'Atendimento desrespeitoso ou indiferente.',                               polaridade: -1, categoria: 'orgao' },

  // ── Serviços Públicos — positivos ──────────────────────────────────────────
  { nome: 'Qualidade do Atendimento',    descricao: 'Atendimento respeitoso, cordial e resolutivo.',                            polaridade:  1, categoria: 'servico' },
  { nome: 'Rapidez',                     descricao: 'Prestação do serviço em prazo adequado.',                                  polaridade:  1, categoria: 'servico' },
  { nome: 'Disponibilidade',             descricao: 'Facilidade para acessar o serviço quando necessário.',                     polaridade:  1, categoria: 'servico' },
  { nome: 'Confiabilidade Operacional',  descricao: 'Funcionamento regular e previsível do serviço.',                          polaridade:  1, categoria: 'servico' },
  { nome: 'Cobertura',                   descricao: 'Capacidade de atender diferentes regiões e públicos.',                     polaridade:  1, categoria: 'servico' },
  { nome: 'Continuidade',                descricao: 'Manutenção do serviço sem interrupções frequentes.',                       polaridade:  1, categoria: 'servico' },
  { nome: 'Efetividade',                 descricao: 'Capacidade de resolver a necessidade do cidadão.',                        polaridade:  1, categoria: 'servico' },
  { nome: 'Modernização',                descricao: 'Utilização de tecnologias e processos que facilitam o atendimento.',       polaridade:  1, categoria: 'servico' },

  // ── Serviços Públicos — negativos ──────────────────────────────────────────
  { nome: 'Demora no Atendimento',       descricao: 'Prestação do serviço em prazo inadequado.',                                polaridade: -1, categoria: 'servico' },
  { nome: 'Superlotação',                descricao: 'Excesso de demanda sem estrutura adequada para atender.',                  polaridade: -1, categoria: 'servico' },
  { nome: 'Falta de Urbanidade',         descricao: 'Atendimento grosseiro ou desrespeitoso.',                                  polaridade: -1, categoria: 'servico' },
  { nome: 'Ineficácia',                  descricao: 'Incapacidade de resolver a necessidade do cidadão.',                      polaridade: -1, categoria: 'servico' },
  { nome: 'Cobertura Insuficiente',      descricao: 'Falta de alcance para atender toda a população necessária.',              polaridade: -1, categoria: 'servico' },
  { nome: 'Interrupções Frequentes',     descricao: 'Serviço instável com paralisações recorrentes.',                          polaridade: -1, categoria: 'servico' },
  { nome: 'Precariedade',                descricao: 'Infraestrutura e condições inadequadas de funcionamento.',                 polaridade: -1, categoria: 'servico' },
  { nome: 'Desatualização',              descricao: 'Processos e tecnologias obsoletos que dificultam o atendimento.',         polaridade: -1, categoria: 'servico' },
];

async function main() {
  console.log('=== SEED ATRIBUTOS — PULSO ELEITORAL ===\n');

  let criados = 0;
  let atualizados = 0;

  for (const a of ATRIBUTOS) {
    const existing = await prisma.atributo.findUnique({ where: { nome: a.nome } });
    if (existing) {
      await prisma.atributo.update({
        where: { nome: a.nome },
        data: { descricao: a.descricao, polaridade: a.polaridade, categoria: a.categoria, visivel: true },
      });
      atualizados++;
    } else {
      await prisma.atributo.create({ data: { ...a, visivel: true } });
      criados++;
    }
    const pol = a.polaridade > 0 ? '+' : '−';
    console.log(`  [${a.categoria.padEnd(8)}] ${pol} ${a.nome}`);
  }

  const totais = await prisma.atributo.groupBy({ by: ['categoria'], _count: true });
  console.log('\n=== TOTAIS ===');
  for (const t of totais) console.log(`  ${t.categoria}: ${t._count} atributos`);
  console.log(`\n  Criados: ${criados} | Atualizados: ${atualizados}`);
  console.log('\n✨ Seed de atributos concluído!');
}

main()
  .catch(e => { console.error('❌', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
