FROM node:18-alpine

WORKDIR /app

# העתקת package files
COPY package*.json ./
COPY prisma ./prisma/

# התקנת dependencies
RUN npm ci --only=production

# העתקת כל הקבצים
COPY . .

# יצירת build
RUN npm run build

# יצירת user שאינו root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# הרשאות
USER nextjs

EXPOSE 3000

ENV NODE_ENV production

CMD ["npm", "start"] 