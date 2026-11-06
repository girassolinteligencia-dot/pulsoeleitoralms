const baseUrl = process.env.SMOKE_BASE_URL || 'http://localhost:3010';
const defaultDelayMs = baseUrl.startsWith('https://') ? 1500 : 0;
const delayMs = Number(process.env.SMOKE_DELAY_MS || defaultDelayMs);

let failures = 0;

function record(ok, label, details) {
  const marker = ok ? 'OK' : 'FAIL';
  console.log(`${marker} ${label}${details ? ` - ${details}` : ''}`);
  if (!ok) failures += 1;
}

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

async function fetchJson(path, init) {
  if (delayMs > 0) await sleep(delayMs);
  const res = await fetch(`${baseUrl}${path}`, init);
  const data = await res.json().catch(() => null);
  return { res, data };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAtributos(candidato) {
  const atributos = candidato?.campanha?.atributos;
  if (!Array.isArray(atributos)) return [];

  return atributos
    .map((item) => item?.atributo)
    .filter((atributo) => atributo?.id && atributo?.nome);
}

function validatePercepcao(data) {
  if (!isObject(data)) return false;
  if (!isObject(data.resumo)) return false;
  if (!isObject(data.leitura)) return false;
  if (!isObject(data.atributos)) return false;
  if (!isObject(data.origem)) return false;

  const numericFields = [
    'vozesValidas',
    'aprovacoes',
    'desaprovacoes',
    'semRespostaAprovacao',
    'expectativaVitoria',
    'aprovacaoPct',
    'desaprovacaoPct',
    'expectativaPct',
    'saldoPercepcao',
  ];

  return (
    numericFields.every((field) => Number.isFinite(data.resumo[field])) &&
    typeof data.leitura.titulo === 'string' &&
    typeof data.leitura.descricao === 'string' &&
    Array.isArray(data.atributos.forcas) &&
    Array.isArray(data.atributos.alertas) &&
    Array.isArray(data.origem.cidades) &&
    Array.isArray(data.origem.bairros) &&
    typeof data.aviso === 'string'
  );
}

console.log('PULSO ELEITORAL MS - Public flow smoke');
console.log(`App base URL: ${baseUrl}`);

const cepResponse = await fetchJson('/api/cep/79002000');
record(
  cepResponse.res.ok &&
    cepResponse.data?.cidade === 'Campo Grande' &&
    cepResponse.data?.uf === 'MS' &&
    typeof cepResponse.data?.bairro === 'string' &&
    ['brasilapi', 'ibge_enderecos'].includes(cepResponse.data?.origem) &&
    Array.isArray(cepResponse.data?.bairrosPossiveis),
  'CEP lookup resolves respondent geography',
  `status ${cepResponse.res.status}`
);

const candidatosResponse = await fetchJson('/api/candidatos');
const candidatos = Array.isArray(candidatosResponse.data) ? candidatosResponse.data : [];
record(
  candidatosResponse.res.ok && candidatos.length > 0,
  'public candidates available',
  `status ${candidatosResponse.res.status}, count ${candidatos.length}`
);

const candidato = candidatos.find((item) => getAtributos(item).length > 0) || candidatos[0];
const atributos = getAtributos(candidato);
record(
  Boolean(candidato?.id && atributos.length > 0),
  'candidate has visible campaign attributes',
  candidato?.id ? `${candidato.nome} (${atributos.length} atributo(s))` : 'no candidate'
);

if (candidato?.id) {
  const fingerprint = `public-smoke-${Date.now()}`;
  const sessionResponse = await fetchJson('/api/avaliar/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ candidatoId: candidato.id, fingerprint }),
  });

  record(
    sessionResponse.res.ok && typeof sessionResponse.data?.token === 'string',
    'evaluation session can be created',
    `status ${sessionResponse.res.status}`
  );

  if (typeof sessionResponse.data?.token === 'string') {
    const invalidEvaluationResponse = await fetchJson('/api/avaliar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidatoId: candidato.id,
        fingerprint,
        sessionToken: sessionResponse.data.token,
        avaliacoes: [{ atributoId: '__invalid_attribute__', valor: 1 }],
        perfil: {
          cidade: 'Campo Grande',
          bairro: 'Smoke Test',
        },
        aprovacao: 'sim',
        expectativaVitoria: 'nao',
      }),
    });

    record(
      invalidEvaluationResponse.res.status === 400,
      'invalid evaluation is rejected without write',
      `status ${invalidEvaluationResponse.res.status}`
    );
  }

  const percepcaoResponse = await fetchJson(`/api/resultados/${encodeURIComponent(candidato.id)}/percepcao`);
  record(
    percepcaoResponse.res.ok && validatePercepcao(percepcaoResponse.data),
    'perception dashboard contract is complete',
    `status ${percepcaoResponse.res.status}`
  );

  const resultadosResponse = await fetchJson(`/api/resultados/${encodeURIComponent(candidato.id)}`);
  record(
    resultadosResponse.res.ok && Array.isArray(resultadosResponse.data),
    'basic result attributes endpoint responds',
    `status ${resultadosResponse.res.status}, count ${Array.isArray(resultadosResponse.data) ? resultadosResponse.data.length : 'invalid-json'}`
  );
}

if (failures > 0) {
  console.error(`Public flow smoke failed with ${failures} failure(s).`);
  process.exit(1);
}

console.log('Public flow smoke passed.');
