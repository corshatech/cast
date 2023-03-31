from node:18-alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV production

RUN addgroup -g 12345 -S CAST
RUN adduser -S CAST -u 12345
RUN chown -R CAST:CAST /app

USER CAST

EXPOSE 3000

ENV PORT 3000

CMD ["node", "index.js"]
