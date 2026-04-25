# Pulso Eleitoral

Plataforma independente de monitoramento de sentimento eleitoral e pesquisas de opinião em tempo real.

## 🚀 Tecnologias

- **Framework**: Next.js 16 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS v4 / Vanilla CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **CI/CD**: GitHub Actions + Vercel

## 📦 Setup Inicial

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/[usuario]/pulsoeleitoral.git
   cd pulsoeleitoral
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**:
   Copie o arquivo `.env.example` para `.env.local` e preencha com suas credenciais:
   ```bash
   cp .env.example .env.local
   ```

4. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

## 🛠️ Convenções de Desenvolvimento

### Commits (Conventional Commits)

Seguimos o padrão de commits semânticos:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `chore`: Configuração, dependências
- `style`: Ajuste visual sem lógica
- `refactor`: Refatoração sem mudança de comportamento
- `docs`: Documentação

### Branches

- `main`: Ambiente de produção.
- `develop`: Ambiente de integração e homologação.

## 🧪 CI/CD

Temos um workflow de CI automatizado via GitHub Actions que executa:
1. Instalação de dependências
2. Linting (`npm run lint`)
3. Build de verificação (`npm run build`)

---

© 2026 Pulso Eleitoral • Plataforma Independente
