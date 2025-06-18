FROM node:18-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies without postinstall
RUN npm ci --only=production --ignore-scripts

# Copy source code and prisma schema
COPY . .

# Generate Prisma client after copying everything
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["npm", "run", "start"] 