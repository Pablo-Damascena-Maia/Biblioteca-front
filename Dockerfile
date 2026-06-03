# ── Estágio 1: Build do React ──────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

# Copia manifests de dependências
COPY package.json package-lock.json ./

# Instala todas as dependências (dev + prod para o build)
RUN npm install

# Copia o restante do código
COPY . .

# Garante que o .env está disponível para o Vite (VITE_* são embeddados no build)
# O COPY . . acima já inclui o .env, mas deixamos explícito aqui.

# Gera o bundle estático em dist/public
RUN npm run build

# ── Estágio 2: Servidor de produção ───────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Copia apenas o necessário para rodar em produção
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copia o bundle do React e o servidor Express compilado
COPY --from=builder /app/dist ./dist

# Copia .env.production para que o Express leia VITE_URL_* em runtime (fallback dos proxies)
COPY .env.production .env

EXPOSE 9505

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
