## DevScout Clone (MVP) – Bootstrap

This repository hosts the lean MVP implementation for the DevScout clone. It is a single Next.js 15 application written in TypeScript and designed to run entirely via Docker for local development and deployment.

### Requirements

- Node.js ≥ 20.18 (only if running outside Docker)
- PNPM 10 (Corepack or `npm install -g pnpm`)
- Docker & Docker Compose

### Initial Setup

```bash
cp env.example .env.local   # customise values, especially DATABASE_URL & NEXTAUTH_SECRET
pnpm install
pnpm prisma generate
pnpm db:push                # provisions the schema locally
pnpm dev
```

The app is served at [http://localhost:3000](http://localhost:3000).

### Running with Docker

```bash
docker compose up --build
```

Services:

- `app`: Next.js dev server with hot reload
- `worker`: placeholder for cron/queue workers (exits immediately until implemented)
- `postgres`: PostgreSQL 16 with persistent volume
- `mailhog`: test SMTP server (UI on http://localhost:8025)

### Useful Scripts

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Start Next.js dev server |
| `pnpm build` / `pnpm start` | Build and start production bundle |
| `pnpm lint` / `pnpm lint:fix` | Run ESLint checks |
| `pnpm typecheck` | TypeScript project validation |
| `pnpm test` / `pnpm test:watch` | Execute Vitest unit tests |
| `pnpm test:coverage` | Coverage report |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:format` | Format Prisma schema |
| `pnpm db:push` | Push Prisma schema to the database |
| `pnpm db:migrate` | Apply migrations in production environments |

### Project Structure

```
├── prisma/               # Prisma schema & future migrations
├── src/
│   ├── app/              # Next.js App Router
│   └── lib/              # Shared utilities (env parsing, scoring, etc.)
├── docker-compose.yml    # Local dev stack (app + worker + postgres + mailhog)
├── Dockerfile            # Multi-stage build for dev/prod
├── vitest.config.ts      # Vitest configuration
└── env.example           # Base environment configuration
```

### Testing & QA

Vitest is configured with JSDOM and Testing Library helpers. Add tests under `src/**/*.test.ts(x)` and run `pnpm test` while developing. Coverage output is emitted in `coverage/`.

### Deployment Notes

- Build the production image via `docker build -t devscout-app .`
- Run with `DATABASE_URL` and other secrets provided as environment variables.
- Use a process supervisor or orchestrator (e.g., systemd, Docker Swarm) to run worker processes alongside the web app.

Refer to the `docker-compose.yml` for starting points when deploying on VPS providers.
