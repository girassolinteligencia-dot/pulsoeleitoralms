import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

function getTokenHashSecret() {
  const secret =
    process.env.API_TOKEN_HASH_SECRET ||
    process.env.ENCRYPTION_KEY ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('API token hash secret is not configured.');
  }

  return secret;
}

export function hashApiToken(token: string) {
  return createHmac('sha256', getTokenHashSecret())
    .update(token)
    .digest('hex');
}

export function verifyApiTokenHash(token: string, tokenHash: string) {
  const expected = hashApiToken(token);
  const actualBuffer = Buffer.from(tokenHash, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function maskApiToken(prefix: string | undefined) {
  return prefix ? `${prefix}••••••••••••••••••••••` : '••••••••••••••••••••••';
}
