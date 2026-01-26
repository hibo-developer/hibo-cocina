# HIBO Cocina - Dockerfile
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy app source
COPY . .

# Environment
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
