CREATE TABLE `admin_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`nome` text,
	`role` text DEFAULT 'viewer' NOT NULL,
	`ativo` integer DEFAULT true NOT NULL,
	`ultimo_login_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_email_unique` ON `admin_users` (`email`);--> statement-breakpoint
CREATE INDEX `admin_users_ativo_idx` ON `admin_users` (`ativo`);--> statement-breakpoint
CREATE INDEX `admin_users_role_idx` ON `admin_users` (`role`);--> statement-breakpoint
CREATE TABLE `atributos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`descricao` text,
	`icone` text,
	`polaridade` integer DEFAULT 1 NOT NULL,
	`visivel` integer DEFAULT true NOT NULL,
	`categoria` text DEFAULT 'politico' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `atributos_nome_unique` ON `atributos` (`nome`);--> statement-breakpoint
CREATE INDEX `atributos_categoria_idx` ON `atributos` (`categoria`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`acao` text NOT NULL,
	`entidade` text NOT NULL,
	`entidade_id` text NOT NULL,
	`detalhes` text,
	`usuario_id` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_logs_criado_idx` ON `audit_logs` (`criado_em`);--> statement-breakpoint
CREATE INDEX `audit_logs_acao_criado_idx` ON `audit_logs` (`acao`,`criado_em`);--> statement-breakpoint
CREATE INDEX `audit_logs_entidade_criado_idx` ON `audit_logs` (`entidade`,`criado_em`);--> statement-breakpoint
CREATE TABLE `avaliacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`manifestacao_id` text,
	`candidato_id` text,
	`orgao_id` text,
	`servico_id` text,
	`atributo_id` text NOT NULL,
	`valor` integer NOT NULL,
	`is_valid` integer DEFAULT true NOT NULL,
	`fingerprint_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text,
	`duration_ms` integer,
	`honeypot_triggered` integer DEFAULT false NOT NULL,
	`device_info` text,
	`geo_location` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`manifestacao_id`) REFERENCES `manifestacoes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`candidato_id`) REFERENCES `candidatos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`orgao_id`) REFERENCES `orgaos_publicos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`servico_id`) REFERENCES `servicos_publicos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`atributo_id`) REFERENCES `atributos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `avaliacoes_candidato_idx` ON `avaliacoes` (`candidato_id`);--> statement-breakpoint
CREATE INDEX `avaliacoes_orgao_idx` ON `avaliacoes` (`orgao_id`);--> statement-breakpoint
CREATE INDEX `avaliacoes_servico_idx` ON `avaliacoes` (`servico_id`);--> statement-breakpoint
CREATE INDEX `avaliacoes_manifestacao_idx` ON `avaliacoes` (`manifestacao_id`);--> statement-breakpoint
CREATE INDEX `avaliacoes_atributo_idx` ON `avaliacoes` (`atributo_id`);--> statement-breakpoint
CREATE INDEX `avaliacoes_criado_idx` ON `avaliacoes` (`criado_em`);--> statement-breakpoint
CREATE TABLE `bloqueios` (
	`id` text PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`motivo` text,
	`expira_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bloqueios_hash_unique` ON `bloqueios` (`hash`);--> statement-breakpoint
CREATE TABLE `campanha_atributos` (
	`id` text PRIMARY KEY NOT NULL,
	`campanha_id` text NOT NULL,
	`atributo_id` text NOT NULL,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`atributo_id`) REFERENCES `atributos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `campanha_atributos_campanha_idx` ON `campanha_atributos` (`campanha_id`);--> statement-breakpoint
CREATE INDEX `campanha_atributos_atributo_idx` ON `campanha_atributos` (`atributo_id`);--> statement-breakpoint
CREATE TABLE `campanhas` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`slug` text NOT NULL,
	`status` text DEFAULT 'ativo' NOT NULL,
	`total_votos` integer DEFAULT 0 NOT NULL,
	`media_consolidada` real DEFAULT 0 NOT NULL,
	`last_calc_at` integer,
	`meta_config` text,
	`data_inicio` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`data_fim` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `campanhas_slug_unique` ON `campanhas` (`slug`);--> statement-breakpoint
CREATE TABLE `candidatos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`partido` text,
	`numero` text,
	`cargo` text NOT NULL,
	`foto_url` text,
	`ano_eleicao` integer DEFAULT 2024 NOT NULL,
	`cidade` text NOT NULL,
	`bairro` text,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`status_verificacao` integer DEFAULT false NOT NULL,
	`total_avaliacoes` integer DEFAULT 0 NOT NULL,
	`campanha_id` text NOT NULL,
	`sq_candidato` text,
	`nome_urna` text,
	`cd_municipio_tse` text,
	`situacao_candidatura` text,
	`situacao_totalizacao` text,
	`fonte` text DEFAULT 'manual' NOT NULL,
	`atualizado_tse_em` integer,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `candidatos_ano_sq_uq` ON `candidatos` (`ano_eleicao`,`sq_candidato`);--> statement-breakpoint
CREATE INDEX `candidatos_campanha_idx` ON `candidatos` (`campanha_id`);--> statement-breakpoint
CREATE INDEX `candidatos_cidade_cargo_idx` ON `candidatos` (`cidade`,`cargo`);--> statement-breakpoint
CREATE INDEX `candidatos_ano_cargo_idx` ON `candidatos` (`ano_eleicao`,`cargo`);--> statement-breakpoint
CREATE INDEX `candidatos_nome_idx` ON `candidatos` (`nome`);--> statement-breakpoint
CREATE TABLE `ceps_ms` (
	`cep` text PRIMARY KEY NOT NULL,
	`uf` text DEFAULT 'MS' NOT NULL,
	`cidade` text NOT NULL,
	`bairro` text,
	`logradouro` text,
	`origem` text DEFAULT 'brasilapi' NOT NULL,
	`ibge_municipio_id` text,
	`localidades` text,
	`bairro_confianca` real,
	`total_registros` integer DEFAULT 0 NOT NULL,
	`localidades_count` integer DEFAULT 0 NOT NULL,
	`logradouros_count` integer DEFAULT 0 NOT NULL,
	`latitude` real,
	`longitude` real,
	`importado_em` integer,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `ceps_cidade_idx` ON `ceps_ms` (`cidade`);--> statement-breakpoint
CREATE INDEX `ceps_bairro_idx` ON `ceps_ms` (`bairro`);--> statement-breakpoint
CREATE INDEX `ceps_origem_idx` ON `ceps_ms` (`origem`);--> statement-breakpoint
CREATE INDEX `ceps_lat_lng_idx` ON `ceps_ms` (`latitude`,`longitude`);--> statement-breakpoint
CREATE TABLE `manifestacoes` (
	`id` text PRIMARY KEY NOT NULL,
	`candidato_id` text,
	`orgao_id` text,
	`servico_id` text,
	`aprovacao` integer,
	`expectativa_vitoria` integer,
	`perfil` text,
	`fingerprint_hash` text NOT NULL,
	`ip_hash` text NOT NULL,
	`user_agent` text,
	`duration_ms` integer,
	`is_valid` integer DEFAULT true NOT NULL,
	`honeypot_triggered` integer DEFAULT false NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`candidato_id`) REFERENCES `candidatos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`orgao_id`) REFERENCES `orgaos_publicos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`servico_id`) REFERENCES `servicos_publicos`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `manifestacoes_candidato_idx` ON `manifestacoes` (`candidato_id`);--> statement-breakpoint
CREATE INDEX `manifestacoes_orgao_idx` ON `manifestacoes` (`orgao_id`);--> statement-breakpoint
CREATE INDEX `manifestacoes_servico_idx` ON `manifestacoes` (`servico_id`);--> statement-breakpoint
CREATE INDEX `manifestacoes_fingerprint_idx` ON `manifestacoes` (`fingerprint_hash`);--> statement-breakpoint
CREATE INDEX `manifestacoes_criado_idx` ON `manifestacoes` (`criado_em`);--> statement-breakpoint
CREATE TABLE `orgaos_publicos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`cidade` text NOT NULL,
	`uf` text DEFAULT 'MS' NOT NULL,
	`descricao` text,
	`foto_url` text,
	`campanha_id` text,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `orgaos_cidade_idx` ON `orgaos_publicos` (`cidade`);--> statement-breakpoint
CREATE INDEX `orgaos_tipo_idx` ON `orgaos_publicos` (`tipo`);--> statement-breakpoint
CREATE INDEX `orgaos_status_idx` ON `orgaos_publicos` (`status`);--> statement-breakpoint
CREATE TABLE `parametros_plataforma` (
	`id` text PRIMARY KEY NOT NULL,
	`chave` text NOT NULL,
	`valor` text NOT NULL,
	`grupo` text DEFAULT 'geral' NOT NULL,
	`descricao` text,
	`updatedAt` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parametros_plataforma_chave_unique` ON `parametros_plataforma` (`chave`);--> statement-breakpoint
CREATE TABLE `resumo_alvo` (
	`alvo_tipo` text NOT NULL,
	`alvo_id` text NOT NULL,
	`total_manifestacoes` integer DEFAULT 0 NOT NULL,
	`total_avaliacoes` integer DEFAULT 0 NOT NULL,
	`aprovacoes` integer DEFAULT 0 NOT NULL,
	`desaprovacoes` integer DEFAULT 0 NOT NULL,
	`expectativa_sim` integer DEFAULT 0 NOT NULL,
	`expectativa_nao` integer DEFAULT 0 NOT NULL,
	`saldo_atributos` integer DEFAULT 0 NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	PRIMARY KEY(`alvo_tipo`, `alvo_id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_atributo` (
	`alvo_tipo` text NOT NULL,
	`alvo_id` text NOT NULL,
	`atributo_id` text NOT NULL,
	`positivos` integer DEFAULT 0 NOT NULL,
	`negativos` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`alvo_tipo`, `alvo_id`, `atributo_id`)
);
--> statement-breakpoint
CREATE TABLE `resumo_diario` (
	`dia` text NOT NULL,
	`alvo_tipo` text NOT NULL,
	`manifestacoes` integer DEFAULT 0 NOT NULL,
	`avaliacoes` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`dia`, `alvo_tipo`)
);
--> statement-breakpoint
CREATE TABLE `resumo_territorio` (
	`cidade` text NOT NULL,
	`bairro` text DEFAULT '' NOT NULL,
	`alvo_tipo` text NOT NULL,
	`manifestacoes` integer DEFAULT 0 NOT NULL,
	`aprovacoes` integer DEFAULT 0 NOT NULL,
	`desaprovacoes` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`cidade`, `bairro`, `alvo_tipo`)
);
--> statement-breakpoint
CREATE TABLE `rodadas_metodologicas` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text DEFAULT 'percepcao_espontanea' NOT NULL,
	`status` text DEFAULT 'rascunho' NOT NULL,
	`campanha_id` text,
	`objetivo` text,
	`publico_alvo` text,
	`abrangencia` text,
	`tamanho_amostra` integer,
	`margem_erro` real,
	`nivel_confianca` real,
	`periodo_inicio` integer,
	`periodo_fim` integer,
	`plano_amostral` text,
	`ponderacao` text,
	`questionario` text,
	`observacoes` text,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `rodadas_campanha_idx` ON `rodadas_metodologicas` (`campanha_id`);--> statement-breakpoint
CREATE INDEX `rodadas_tipo_status_idx` ON `rodadas_metodologicas` (`tipo`,`status`);--> statement-breakpoint
CREATE TABLE `servicos_publicos` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text NOT NULL,
	`cidade` text NOT NULL,
	`uf` text DEFAULT 'MS' NOT NULL,
	`descricao` text,
	`foto_url` text,
	`campanha_id` text,
	`status` text DEFAULT 'Ativo' NOT NULL,
	`criado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`atualizado_em` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`campanha_id`) REFERENCES `campanhas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `servicos_cidade_idx` ON `servicos_publicos` (`cidade`);--> statement-breakpoint
CREATE INDEX `servicos_tipo_idx` ON `servicos_publicos` (`tipo`);--> statement-breakpoint
CREATE INDEX `servicos_status_idx` ON `servicos_publicos` (`status`);