# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (using lockfile for reproducibility)
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the app (Vite/React/Vue 모두 기본 output dir: dist)
RUN npm run build

# --------------------------------------------------

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Remove default nginx config and add custom config
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.config /etc/nginx/conf.d/default.conf

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
