FROM node:20-slim AS base

WORKDIR /app

# OpenSSL is required by Prisma's query engine at runtime
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

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