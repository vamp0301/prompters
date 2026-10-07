# ─── build ───
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npx tsc -p tsconfig.build.json

# ─── runtime ───
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
# python3 lets the local "process" sandbox driver run Python; production should use SANDBOX_DRIVER=docker.
RUN apk add --no-cache python3 docker-cli
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm i --no-save prisma@6 && npm cache clean --force
COPY prisma ./prisma
COPY assets ./assets
RUN npx prisma generate
COPY --from=build /app/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/health || exit 1
# Migrations run before the API starts; the worker image overrides CMD with start:worker.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/server/index.js"]
