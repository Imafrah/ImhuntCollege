FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

RUN ls node_modules/.bin/ | grep tsc
RUN npx tsc --version

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

RUN npx tsc

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]