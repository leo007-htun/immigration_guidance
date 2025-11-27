#!/bin/sh
set -e

echo "Checking for SSL certificates..."

# Check if SSL certificates exist
if [ -f /etc/letsencrypt/live/immigrationai.website/fullchain.pem ] && \
   [ -f /etc/letsencrypt/live/immigrationai.website/privkey.pem ]; then
    echo "SSL certificates found - using HTTPS configuration"
    cp /etc/nginx/templates/nginx-ssl.conf /etc/nginx/conf.d/default.conf
else
    echo "SSL certificates not found - using HTTP-only configuration"
    cp /etc/nginx/templates/nginx-nossl.conf /etc/nginx/conf.d/default.conf
fi

# Test nginx configuration
nginx -t

# Start nginx
exec nginx -g "daemon off;"
