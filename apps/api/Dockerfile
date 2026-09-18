FROM node:20-alpine AS base

# Install OpenSSL and libc compatibility for Prisma engine on Alpine Linux
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npx tsc

EXPOSE 5000

CMD ["npm", "start"]
