# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for both client and server
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

RUN npm install
RUN cd client && npm install
RUN cd server && npm install

# Copy source code
COPY client ./client
COPY server ./server

# Build client
RUN cd client && npm run build

# Build server
RUN cd server && npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy server dependencies and build
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy client build
COPY --from=builder /app/client/dist ./client/dist

# Create data directory for SQLite and audio
RUN mkdir -p /app/server/data/audio

WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/index.js"]
