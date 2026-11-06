# LGPD e Retencao de Dados - PULSO ELEITORAL MS

Data: 2026-05-20

Este documento e um guia operacional tecnico. Ele nao substitui revisao juridica.

## Principios aplicados

- Minimizar coleta de identificacao direta: o fluxo publico nao solicita nome, CPF, e-mail ou telefone.
- Usar CEP apenas para resolver cidade/bairro.
- Nao salvar CEP completo na manifestacao.
- Manter dados territoriais para leitura estatistica agregada.
- Manter dados tecnicos hashados para seguranca, auditoria e prevencao de abuso.
- Aplicar retencao periodica a logs e perfis.

## Dados no fluxo publico

A manifestacao pode guardar:

- cidade;
- bairro;
- UF;
- origem territorial;
- confianca do bairro;
- atributos selecionados;
- aprovacao;
- expectativa de vitoria;
- respostas demograficas opcionais;
- hashes tecnicos para seguranca.

O CEP completo fica apenas na tabela auxiliar `ceps_ms`, como base territorial, e nao no perfil da manifestacao.

## Retencao automatica (Cron)

A retencao roda sozinha todos os dias as 07:00 UTC (03:00 em Campo Grande), pelo Cron Trigger `0 7 * * *` do Worker ([src/server/cron.ts](../src/server/cron.ts), funcao `aplicarRetencao`). Ela:

- apaga registros de `audit_logs` mais antigos que `AUDIT_LOG_RETENTION_DAYS` (padrao 365; minimo 30);
- reduz o `perfil` das manifestacoes mais antigas que `PROFILE_RETENTION_DAYS` (padrao 730; minimo 90), mantendo apenas:
  - cidade;
  - bairro;
  - UF;
  - a marca `retencaoPerfilAplicada` e a data em que a reducao foi aplicada;
- apaga bloqueios ja vencidos.

As janelas ficam em `vars` no [wrangler.jsonc](../wrangler.jsonc). Cada execucao registra no log do Worker a linha `[cron] retenção LGPD` com as contagens (`auditLogsApagados`, `perfisMinimizados`, `bloqueiosVencidos`).

## Rotina recomendada

Mensalmente:

1. Conferir nos logs do Worker (Workers Observability) que a retencao rodou todos os dias.
2. Revisar as contagens e registrar no changelog operacional.
3. Antes de diminuir uma janela de retencao, exportar um backup do D1, porque a reducao e irreversivel fora do Time Travel (30 dias).

## Pendencias juridicas

- Revisar textos de `/privacidade` e `/termos`.
- Confirmar e-mail publico de privacidade.
- Definir controlador/operador, se aplicavel.
- Definir politica formal para pedidos de titulares.
- Validar comunicacao publica de que a plataforma mede percepcao espontanea, nao pesquisa eleitoral registrada.
