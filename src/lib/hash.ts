import { createHash } from "crypto";

function getSalt() {
  const salt = process.env.ENCRYPTION_KEY;
  if (salt) return salt;
  // Sem sal, hashes de IP seriam reversíveis por força bruta (espaço de IPv4 pequeno).
  if (process.env.NODE_ENV === "development") return "pulso-dev-only-salt";
  throw new Error(
    "ENCRYPTION_KEY ausente: necessária para anonimizar IP e fingerprint.",
  );
}

/**
 * Hash SHA-256 com sal para IPs e fingerprints (anonimização).
 */
export function generateSecureHash(
  input: string,
  salt: string = getSalt(),
): string {
  return createHash("sha256")
    .update(input + salt)
    .digest("hex");
}

/**
 * Indica se o tempo de avaliação é suspeito (ex.: < 8s).
 */
export function isSuspiciousTiming(
  startTime: number,
  endTime: number,
): boolean {
  const durationInSeconds = (endTime - startTime) / 1000;
  return durationInSeconds < 8;
}
