CREATE TABLE "admin_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");
CREATE INDEX "admin_users_ativo_idx" ON "admin_users"("ativo");
CREATE INDEX "admin_users_role_idx" ON "admin_users"("role");

INSERT INTO "admin_users" ("id", "email", "nome", "role", "ativo", "criado_em", "atualizado_em")
VALUES (
    'admin_girassolinteligencia',
    'girassolinteligencia@gmail.com',
    'Girassol Inteligência',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("email") DO NOTHING;
