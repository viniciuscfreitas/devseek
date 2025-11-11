# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20.18.0

FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

FROM base AS deps
RUN pnpm install --frozen-lockfile

FROM deps AS dev
COPY . .
CMD ["pnpm", "dev"]

FROM deps AS build
ENV NODE_ENV=production
COPY . .
RUN pnpm run build

FROM node:${NODE_VERSION}-slim AS runner
ENV NODE_ENV=production
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY public ./public
COPY next.config.ts ./

EXPOSE 3000
CMD ["pnpm", "start"]

