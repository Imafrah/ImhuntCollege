FROM node:20-alpine

WORKDIR /app

# Install OpenSSL (Prisma often needs this)
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma

RUN npx prisma generate

COPY . .

# Fix permissions
RUN chmod -R 755 /app

# Build app
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]