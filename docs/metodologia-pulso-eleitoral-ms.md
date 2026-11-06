# Metodologia - PULSO ELEITORAL MS

Este documento separa dois modos de uso da plataforma para evitar mistura entre percepção pública espontânea e pesquisa eleitoral formal.

## Modo 1: Percepção Pública Espontânea

Uso atual da plataforma.

Características:

- Participação aberta e auto-selecionada.
- Sem amostra probabilística.
- Sem margem de erro.
- Sem projeção de intenção de voto.
- Métricas adequadas: volume de participação, atributos associados, aprovação direta, expectativa percebida, distribuição de perfis declarados e sinais de engajamento.

Como comunicar:

- "Percepção pública espontânea"
- "Pulso de participação"
- "Sinais de imagem pública"
- "Termômetro de engajamento"

Evitar:

- "Pesquisa eleitoral"
- "Intenção de voto"
- "Representa o eleitorado"
- "Margem de erro"
- "Empate técnico"

## Modo 2: Pesquisa Registrável

Deve ser implementado como módulo separado quando houver plano amostral e objetivo de divulgação como pesquisa eleitoral.

Campos mínimos recomendados:

- Contratante e executor.
- Responsável técnico/estatístico.
- Período de campo.
- Público-alvo.
- Abrangência geográfica.
- Tamanho da amostra.
- Fonte de dados da amostra.
- Plano amostral.
- Critérios de cotas.
- Ponderações aplicadas.
- Questionário completo.
- Margem de erro e nível de confiança, quando metodologicamente cabíveis.
- Relatório de perdas, recusas, invalidações e consistência.

## Evolução Recomendada no Produto

1. Criar cadastro de "Rodadas" com tipo: `percepcao_espontanea` ou `pesquisa_registravel`.
2. Travar linguagem de dashboards conforme o tipo da rodada.
3. Gerar dossiê metodológico por rodada.
4. Separar exportação administrativa de exportação metodológica.
5. Adicionar ponderação apenas no modo registrável.
6. Mostrar aviso público quando a rodada for espontânea: "não se trata de pesquisa eleitoral representativa".

## Módulo Administrativo de Rodadas

O admin passa a ter uma área própria para cadastrar e acompanhar rodadas metodológicas. Cada rodada deve declarar seu tipo, status, campanha relacionada, objetivo, público-alvo, abrangência e, quando aplicável, parâmetros de amostra.

Estados recomendados:

- `rascunho`: planejamento interno, ainda sem uso operacional.
- `ativa`: rodada vigente e passível de uso em relatórios.
- `encerrada`: campo finalizado, preservada para histórico e dossiê.
- `arquivada`: fora do fluxo operacional.

Campos estatísticos como tamanho de amostra, margem de erro, nível de confiança, plano amostral, ponderação e questionário devem ser exigidos apenas para rodadas do tipo `pesquisa_registravel`, quando houver intenção de divulgação como pesquisa eleitoral formal.

## Relatórios por Escopo Metodológico

O hub de relatórios pode operar em dois escopos:

- Período móvel: últimos 7, 30 ou 90 dias, sem vínculo formal com uma rodada.
- Rodada metodológica: período e campanha definidos no cadastro da rodada.

Quando uma rodada é selecionada, os gráficos e o CSV administrativo devem usar o mesmo escopo: campanha vinculada, início/fim de campo e apenas registros válidos. Para rodadas de percepção espontânea, a comunicação deve preservar o aviso de que os resultados não representam amostra probabilística.

## Localização do Participante

A plataforma pode usar CEP apenas como mecanismo de preenchimento de cidade e bairro.

Diretriz operacional:

- Não exigir nome do participante.
- Consultar o CEP em serviço de apoio, como BrasilAPI, para preencher cidade, bairro e UF.
- Pular a etapa de região quando o CEP resolver cidade/bairro com confiança suficiente.
- Exibir confirmação curta apenas quando o CEP tiver múltiplos bairros/localidades possíveis.
- Permitir correção manual da cidade e do bairro quando o CEP falhar ou quando o participante solicitar ajuste.
- Não armazenar o CEP completo na manifestação.
- Salvar apenas cidade, bairro, UF e origem do preenchimento (`cep` ou `manual`).
- Usar cidade/bairro somente para cruzamentos territoriais de percepção coletiva.

## Dossiê Metodológico

Cada rodada pode gerar um dossiê JSON administrativo com:

- identificação da rodada e campanha;
- período operacional considerado;
- regra de escopo aplicada;
- contagens de manifestações e avaliações válidas/inválidas;
- taxa de invalidação;
- atributos mais frequentes;
- metodologia declarada;
- enquadramento de comunicação e restrições.

Esse dossiê é um artefato técnico de auditoria interna. Para divulgação externa, especialmente em `pesquisa_registravel`, o conteúdo ainda deve passar por validação jurídica, estatística e normativa.

## Controles de Qualidade

- Deduplicação por sessão assinada, IP hash e fingerprint hash.
- Tempo mínimo server-side.
- Rate limit por janela curta.
- Validação de candidato ativo e atributos da campanha.
- Trilhas de auditoria para invalidações.
- Indicador de amostra bruta, válida e descartada.
