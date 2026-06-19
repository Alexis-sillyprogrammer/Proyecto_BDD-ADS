FROM node:20-alpine
WORKDIR /app

COPY backend-grpc/package*.json ./
RUN npm install --omit=dev

COPY backend-grpc/ ./backend-grpc/
COPY backend/models ./backend/models
COPY backend/seeder.js ./backend/seeder.js
COPY proto ./proto

WORKDIR /app/backend-grpc
EXPOSE 50051
CMD ["node", "server.js"]