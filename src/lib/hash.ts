import { createHash } from 'crypto';

/**
 * Utility for generating secure hashes for IPs and Fingerprints.
 */
export function generateSecureHash(input: string, salt: string = process.env.ENCRYPTION_KEY || ''): string {
  return createHash('sha256')
    .update(input + salt)
    .digest('hex');
}

/**
 * Validates if the evaluation duration is suspicious (e.g. < 8s).
 */
export function isSuspiciousTiming(startTime: number, endTime: number): boolean {
  const durationInSeconds = (endTime - startTime) / 1000;
  return durationInSeconds < 8;
}
