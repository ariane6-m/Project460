# Use specific Node.js version on Alpine for smaller image
FROM node:22.22.0-trixie-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY package-lock.json ./

# Install production dependencies only with clean cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production

# Switch to root to install nmap, then back to node
USER root
RUN apk add --no-cache nmap

# Copy application source
COPY . .

# Run as non-root user for security
USER node

# Expose application port
EXPOSE 8080

# Use node directly instead of npm start
CMD ["node", "index.js"]
