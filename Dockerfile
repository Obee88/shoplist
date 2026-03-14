# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Production backend
FROM node:20-alpine AS production

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm install --omit=dev

COPY backend/ ./

# Copy built frontend into expected location
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
