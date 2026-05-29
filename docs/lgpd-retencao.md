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

## Scripts de retencao

### AuditLog

Dry-run:

```bash
npm run audit:retention
```

Aplicar:

```bash
npm run audit:retention:apply
```

Janela padrao: `AUDIT_LOG_RETENTION_DAYS=365`.

### Perfil demografico

Dry-run:

```bash
npm run profile:retention
```

Aplicar:

```bash
npm run profile:retention:apply
```

Janela padrao: `PROFILE_RETENTION_DAYS=730`.

O script reduz perfis antigos, preservando apenas:

- cidade;
- bairro;
- UF;
- origem territorial;
- confianca do bairro;
- metadado de aplicacao da retencao.

## Rotina recomendada

Mensalmente:

1. Rodar `npm run audit:retention`.
2. Rodar `npm run profile:retention`.
3. Revisar contagens.
4. Aplicar com `:apply` somente apos conferencia.
5. Registrar a execucao no changelog operacional.

## Pendencias juridicas

- Revisar textos de `/privacidade` e `/termos`.
- Confirmar e-mail publico de privacidade.
- Definir controlador/operador, se aplicavel.
- Definir politica formal para pedidos de titulares.
- Validar comunicacao publica de que a plataforma mede percepcao espontanea, nao pesquisa eleitoral registrada.
