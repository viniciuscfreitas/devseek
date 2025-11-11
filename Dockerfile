# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=20.18.0

FROM node:${NODE_VERSION}-slim AS base
RUN npm install -g pnpm@10.21.0
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="/usr/local/bin:$PNPM_HOME:$PATH"
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
RUN npm install -g pnpm@10.21.0
ENV NODE_ENV=production
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="/usr/local/bin:$PNPM_HOME:$PATH"
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY public ./public
COPY next.config.ts ./

EXPOSE 3000
CMD ["pnpm", "start"]

