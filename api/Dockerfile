# Use specific Node.js version on Debian for smaller image
FROM node:22.22.0-trixie-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package files first to leverage build cache
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --omit=dev

# Switch to root to install nmap
USER root
RUN apt-get update && apt-get install -y nmap && rm -rf /var/lib/apt/lists/*

# Copy application source
COPY . .

# Ensure the node user owns the app directory
RUN chown -R node:node /usr/src/app

# Run as non-root user for security
USER node

# Expose application port
EXPOSE 8080

# Use node directly instead of npm start
CMD ["node", "index.js"]
