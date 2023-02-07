# Core logic Pulled from Next + withDocker page here:
# https://github.com/vercel/next.js/tree/canary/examples/with-docker

# Install dependencies only when needed
FROM node:16-alpine as deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM node:16-alpine as builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The following line disables telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run server.js
FROM node:18-alpine as runner
WORKDIR /app

RUN apk add postgresql-client

ENV NODE_ENV production
# The following line disables telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup -g 12345 -S CAST
RUN adduser -S CAST -u 12345
RUN chown -R CAST:CAST /app

COPY --from=builder --chown=CAST:CAST /app/next.config.js ./
COPY --from=builder --chown=CAST:CAST /app/public ./public
COPY --from=builder --chown=CAST:CAST /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=CAST:CAST /app/.next/standalone ./
COPY --from=builder --chown=CAST:CAST /app/.next/static ./.next/static/

USER CAST

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
