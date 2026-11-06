import "server-only";
import { z } from "zod";

// Segredos (wrangler secret put) e variáveis do Worker, validados na primeira leitura.
const EnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  EVALUATION_SESSION_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),
  JWT_SECRET: z.string().min(32),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  AUDIT_LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(365),
  PROFILE_RETENTION_DAYS: z.coerce.number().int().positive().default(730),
});

export type AppEnv = z.infer<typeof EnvSchema>;

let cached: AppEnv | undefined;

export function appEnv(): AppEnv {
  if (cached) return cached;
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Configuração inválida do ambiente: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
