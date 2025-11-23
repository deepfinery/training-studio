# syntax=docker/dockerfile:1.6
FROM node:20-bullseye AS base
WORKDIR /app

FROM base AS deps
COPY apps/backend/package*.json ./
RUN npm install

FROM deps AS build
COPY apps/backend/tsconfig.json ./
COPY apps/backend/src ./src
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY apps/backend/package*.json ./
COPY apps/global-bundle.pem ./global-bundle.pem
EXPOSE 4000
CMD ["node", "dist/server.js"]
