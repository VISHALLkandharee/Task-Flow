FROM node:20-alpine AS base

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
