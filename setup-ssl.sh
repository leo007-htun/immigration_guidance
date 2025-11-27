#!/bin/bash
# SSL Setup Script for immigrationai.website
# Run this on your IONOS VPS after deploying the application

set -e

DOMAIN="immigrationai.website"
EMAIL="${SSL_EMAIL:-admin@immigrationai.website}"  # Change this or set SSL_EMAIL env var
APP_DIR="${APP_DIR:-/root/leann}"

echo "=== SSL Setup for $DOMAIN ==="
echo "Email: $EMAIL"
echo "App Directory: $APP_DIR"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

cd "$APP_DIR"

# Create directories for certificates
echo "Creating certificate directories..."
mkdir -p certbot/conf
mkdir -p certbot/www

# Check if certificates already exist
if [ -d "certbot/conf/live/$DOMAIN" ]; then
    echo "SSL certificates already exist for $DOMAIN"
    echo "Skipping certificate generation..."
else
    # Stop Docker containers temporarily
    echo "Stopping Docker containers..."
    docker-compose down

    # Obtain SSL certificate using standalone mode
    echo "Obtaining SSL certificate for $DOMAIN and www.$DOMAIN..."
    docker run -it --rm \
        -p 80:80 \
        -v "$APP_DIR/certbot/conf:/etc/letsencrypt" \
        -v "$APP_DIR/certbot/www:/var/www/certbot" \
        certbot/certbot certonly \
        --standalone \
        -d $DOMAIN \
        -d www.$DOMAIN \
        --non-interactive \
        --agree-tos \
        --email $EMAIL \
        --http-01-port 80

    echo "SSL certificates obtained successfully!"
fi

# Start services with SSL
echo "Starting services with HTTPS..."
docker-compose up -d --build

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Test HTTPS
echo "Testing HTTPS connection..."
curl -k https://localhost || echo "Warning: HTTPS test failed (this is normal if DNS isn't configured yet)"

# Setup auto-renewal cron job
echo "Setting up certificate auto-renewal..."
CRON_CMD="0 3 * * * docker-compose -f $APP_DIR/docker-compose.yml restart certbot && docker-compose -f $APP_DIR/docker-compose.yml restart frontend"
(crontab -l 2>/dev/null | grep -v "certbot" ; echo "$CRON_CMD") | crontab -

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "✅ Your site is now secured with HTTPS!"
echo ""
echo "Access your site at:"
echo "  🌐 https://$DOMAIN"
echo "  🌐 https://www.$DOMAIN"
echo ""
echo "📋 Admin Dashboard:"
echo "  🔐 https://$DOMAIN/admin"
echo ""
echo "🔄 Certificate auto-renewal is configured"
echo "   Certificates will automatically renew before expiration"
echo ""
echo "⚠️  Note: Make sure your DNS A records point to this server:"
echo "   $DOMAIN → $(curl -s ifconfig.me)"
echo "   www.$DOMAIN → $(curl -s ifconfig.me)"
echo ""
