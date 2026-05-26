FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --include=dev

COPY prisma ./prisma
COPY . .

RUN npx prisma generate
RUN npx tsc

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
