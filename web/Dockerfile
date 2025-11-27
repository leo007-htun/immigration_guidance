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

# Install required packages
RUN apk add --no-cache bash

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Create nginx templates directory
RUN mkdir -p /etc/nginx/templates

# Copy both nginx configurations as templates
COPY nginx.conf /etc/nginx/templates/nginx-ssl.conf
COPY nginx-nossl.conf /etc/nginx/templates/nginx-nossl.conf

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
