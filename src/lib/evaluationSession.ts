import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

const SESSION_TTL_MS = 30 * 60 * 1000;

interface EvaluationSessionPayload {
  candidatoId: string;
  fingerprintHash: string;
  startedAt: number;
  expiresAt: number;
  nonce: string;
}

function getSessionSecret() {
  return (
    process.env.EVALUATION_SESSION_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.DATABASE_URL ||
    'pulso-eleitoral-ms-local-session-secret'
  );
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(encodedPayload: string) {
  return createHmac('sha256', getSessionSecret())
    .update(encodedPayload)
    .digest('base64url');
}

export function createEvaluationSession(candidatoId: string, fingerprintHash: string) {
  const startedAt = Date.now();
  const payload: EvaluationSessionPayload = {
    candidatoId,
    fingerprintHash,
    startedAt,
    expiresAt: startedAt + SESSION_TTL_MS,
    nonce: randomUUID(),
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    startedAt,
    expiresAt: payload.expiresAt,
  };
}

export function verifyEvaluationSession(token: string) {
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as EvaluationSessionPayload;
    if (
      typeof payload.candidatoId !== 'string' ||
      typeof payload.fingerprintHash !== 'string' ||
      typeof payload.startedAt !== 'number' ||
      typeof payload.expiresAt !== 'number' ||
      Date.now() > payload.expiresAt
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
