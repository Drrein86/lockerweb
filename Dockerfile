FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

RUN mkdir -p /app/ssl
RUN mkdir -p /app/storage

RUN chown -R node:node /app
RUN chmod -R 755 /app

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production
ENV USE_SSL=false
ENV SSL_KEY_PATH=/app/ssl/key.pem
ENV SSL_CERT_PATH=/app/ssl/cert.pem
ENV ESP32_LOCKER1_IP=192.168.0.104
ENV ESP32_LOCKER2_IP=192.168.0.105

USER node
CMD ["node", "locker-hardware-server.js"] 