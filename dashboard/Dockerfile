# Build stage
FROM node:22.9.0-alpine3.20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN --mount=type=cache,target=/root/.npm \
    npm install

# Copy application source
COPY . .

# Build the React application
RUN npm run build

# Production stage
FROM node:22.9.0-alpine3.20

WORKDIR /app

# Install serve to host the static files
RUN --mount=type=cache,target=/root/.npm \
    npm install -g serve

# Copy built assets from builder stage
COPY --from=builder /app/build ./build

# Run as non-root user for security
USER node

# Expose application port
EXPOSE 3000

# Serve the static build
CMD ["serve", "-s", "build", "-l", "3000"]
