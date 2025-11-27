# LEANN Immigration Chatbot - Deployment Guide

This guide covers deploying the LEANN Immigration Chatbot application to IONOS VPS using Docker Compose.

## 🏗️ Architecture

The application consists of three main services:
- **PostgreSQL Database**: User data, chat history, and memory storage
- **FastAPI Backend**: Authentication, chat API, and admin dashboard API
- **React Frontend with Nginx**: User interface served via Nginx reverse proxy

## 📋 Prerequisites

### On Your VPS (IONOS)
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Git installed
- Minimum 2GB RAM, 20GB disk space
- Open ports: 80 (HTTP), 443 (HTTPS, optional)

### Installation on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose -y

# Install Git
sudo apt install git -y

# Log out and log back in for group changes to take effect
```

## 🚀 Deployment Steps

### 1. Clone Repository on VPS

```bash
git clone https://github.com/yourusername/leann.git
cd leann
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

**Important**: Update these values in `.env`:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ADMIN_KEY`: OpenAI API key with admin access (for usage tracking)
- `ORG_ID`: Your OpenAI organization ID (optional)
- `JWT_SECRET_KEY`: Generate a strong random secret (use `openssl rand -hex 32`)
- `DATABASE_PASSWORD`: Change from default for production

### 3. Prepare Data Directory

```bash
# Create data directory for documents and index
mkdir -p data
chmod 755 data

# Upload your PDF documents to the data directory
# You can use scp, rsync, or SFTP to upload files
```

### 4. Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start all services (database will auto-initialize)
docker-compose up -d

# View logs
docker-compose logs -f
```

The database initialization script (`create_userdb.sh`) will automatically run when PostgreSQL starts for the first time, creating all necessary tables and indexes.

### 5. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Check backend health
curl http://localhost:3001/api/health

# Check frontend (should return HTML)
curl http://localhost
```

### 6. Create LEANN Index

After uploading PDF documents to the `data/` directory:

1. Log in to admin dashboard: `http://your-vps-ip/admin`
2. Credentials: `admin@hotmail.com` / `admin`
3. Go to "Document Management" section
4. Click "Rebuild Index" to process all PDFs

Or via command line:

```bash
docker-compose exec backend python3 /app/src/utils/leann_converter.py
```

## 🔐 Security Recommendations

### 1. Change Default Admin Password

After first login, update the admin password in the database:

```bash
docker-compose exec postgres psql -U useradmin -d userdb -c \
  "UPDATE users SET password_hash = crypt('your-new-password', gen_salt('bf')) WHERE email = 'admin@hotmail.com';"
```

### 2. Setup HTTPS with Let's Encrypt

Install Certbot and obtain SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

Update `docker-compose.yml` to expose port 443 for the frontend service.

### 3. Configure Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 4. Secure Environment Variables

```bash
# Restrict .env file permissions
chmod 600 .env
```

## 🔄 CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to IONOS VPS

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /path/to/leann
            git pull origin main
            docker-compose build
            docker-compose up -d
            docker-compose exec -T backend python3 /app/src/utils/leann_converter.py
```

Add these secrets to your GitHub repository:
- `VPS_HOST`: Your VPS IP address
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: SSH private key

## 📊 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Check Resource Usage

```bash
docker stats
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U useradmin userdb > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U useradmin userdb < backup_20240101.sql
```

## 🔧 Maintenance

### Update Application

```bash
cd leann
git pull origin main
docker-compose build
docker-compose up -d
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down

# Remove all data (WARNING: deletes database)
docker-compose down -v
```

## 🐛 Troubleshooting

### Backend Can't Connect to Database

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### Frontend Shows 502 Bad Gateway

```bash
# Check backend health
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Index Build Fails

```bash
# Check if leann is installed
docker-compose exec backend pip list | grep leann

# Check document permissions
ls -la data/

# Rebuild with verbose output
docker-compose exec backend python3 /app/src/utils/leann_converter.py
```

## 🌐 Domain Configuration

### Configure Domain DNS

Point your domain to your VPS IP:
- **A Record**: `yourdomain.com` → `your.vps.ip.address`
- **A Record**: `www.yourdomain.com` → `your.vps.ip.address`

### Update Frontend Environment

Update `web/.env.production`:
```
VITE_API_URL=https://yourdomain.com/api
```

Rebuild frontend:
```bash
docker-compose build frontend
docker-compose up -d frontend
```

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review GitHub Issues
- Check LEANN documentation

## 📝 Notes

- The admin user (`admin@hotmail.com` / `admin`) is created automatically on first startup
- Database is persisted in Docker volume `postgres_data`
- Document files are stored in `./data` directory
- Tokens expire after 8 hours (configurable in `server/main.py`)
- Usage tracking requires `ADMIN_KEY` to be set
