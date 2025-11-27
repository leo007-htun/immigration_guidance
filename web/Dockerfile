# ===============================
# Stage 1: Build React application
# ===============================
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build the app
COPY . .
RUN npm run build

# ===============================
# Stage 2: Serve with Nginx
# ===============================
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# SSL certificates from certbot (mounted as volumes in docker-compose)
# Example: /etc/letsencrypt/live/yourdomain/fullchain.pem
# Make sure docker-compose mounts ./certbot/conf:/etc/letsencrypt

EXPOSE 80
EXPOSE 443

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
