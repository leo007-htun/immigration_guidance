# 🚀 Quick Deployment Guide - immigrationai.website

## Prerequisites
- ✅ IONOS VPS with Docker & Docker Compose installed
- ✅ Domain DNS configured: `immigrationai.website` → VPS IP
- ✅ Ports 80 and 443 open in firewall

## Step 1: Clone & Configure (5 minutes)

```bash
# Clone repository
git clone https://github.com/yourusername/leann.git
cd leann

# Configure environment
cp .env.example .env
nano .env
```

**Update `.env` with**:
- `OPENAI_API_KEY` - Your OpenAI API key
- `ADMIN_KEY` - OpenAI API key with admin access
- `JWT_SECRET_KEY` - Generate with: `openssl rand -hex 32`

## Step 2: Deploy Application (5 minutes)

```bash
# Build and start all services
docker-compose up -d

# Watch logs
docker-compose logs -f
```

**Services will start**:
- ✅ PostgreSQL (auto-initializes database)
- ✅ FastAPI Backend (auto-creates admin user)
- ✅ React Frontend with Nginx
- ✅ Certbot (for SSL)

## Step 3: Setup HTTPS (2 minutes)

```bash
# Run SSL setup script
sudo ./setup-ssl.sh
```

This will:
- Obtain Let's Encrypt certificates
- Configure auto-renewal
- Enable HTTPS redirect

## Step 4: Access Your Application

### Production URLs
- 🌐 **Website**: https://www.immigrationai.website
- 🔐 **Admin Dashboard**: https://www.immigrationai.website/admin
- 🔧 **Backend API**: https://www.immigrationai.website/api

### Default Admin Credentials
- Email: `admin@hotmail.com`
- Password: `admin`
- ⚠️ **Change this immediately after first login!**

## Step 5: Upload Documents & Build Index

1. Login to admin dashboard
2. Navigate to "Document Management"
3. Upload PDF documents
4. Click "Rebuild Index"

Or via command line:
```bash
# Copy PDFs to data directory
cp your-docs/*.pdf /root/leann/data/

# Rebuild index
docker-compose exec backend python3 /app/src/utils/leann_converter.py
```

## Quick Commands

### View Logs
```bash
docker-compose logs -f backend    # Backend logs
docker-compose logs -f frontend   # Nginx logs
docker-compose logs -f postgres   # Database logs
```

### Restart Services
```bash
docker-compose restart backend    # Restart backend only
docker-compose restart            # Restart all services
```

### Update Application
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Database Backup
```bash
docker-compose exec postgres pg_dump -U useradmin userdb > backup_$(date +%Y%m%d).sql
```

### Check Service Health
```bash
docker-compose ps                 # All services status
curl https://www.immigrationai.website/api/health
```

## Troubleshooting

### Services won't start
```bash
docker-compose down
docker-compose up -d
docker-compose logs -f
```

### SSL certificate issues
```bash
sudo ./setup-ssl.sh  # Re-run SSL setup
```

### Can't access website
- Check DNS: `dig www.immigrationai.website`
- Check firewall: `sudo ufw status`
- Check logs: `docker-compose logs frontend`

### Backend errors
```bash
docker-compose logs backend
docker-compose restart backend
```

## URLs Reference

| Service | URL |
|---------|-----|
| Homepage | https://www.immigrationai.website |
| Admin Dashboard | https://www.immigrationai.website/admin |
| API Health Check | https://www.immigrationai.website/api/health |
| API Login | https://www.immigrationai.website/api/auth/login |
| API Chat | https://www.immigrationai.website/api/chat |

## CI/CD (Optional)

Add these secrets to your GitHub repository:
- `VPS_HOST`: Your VPS IP
- `VPS_USER`: SSH username (e.g., `root`)
- `VPS_SSH_KEY`: Private SSH key
- `APP_PATH`: `/root/leann`

Push to `main` branch → Auto-deploy!

## Security Checklist

- [ ] Changed admin password
- [ ] Updated `.env` with secure JWT secret
- [ ] Changed database password in `.env`
- [ ] SSL/HTTPS enabled
- [ ] Firewall configured (ports 22, 80, 443 only)
- [ ] Set `.env` permissions: `chmod 600 .env`

## Support

- 📖 Full docs: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🐳 Docker setup: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- 📘 Main README: [README.md](./README.md)

---

**Total deployment time: ~15 minutes** ⚡
