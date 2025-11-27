# Docker Setup Complete ✅

## 📦 What Was Created

### Docker Configuration Files

1. **`docker-compose.yml`** - Main orchestration file
   - PostgreSQL database service
   - FastAPI backend service
   - React frontend with Nginx service
   - Automatic network and volume configuration

2. **`server/Dockerfile`** - Backend container image
   - Python 3.10 slim base
   - PostgreSQL client for DB operations
   - LEANN library pre-installed
   - Health check endpoint
   - Entrypoint script for initialization

3. **`web/Dockerfile`** - Frontend container image
   - Multi-stage build (build + production)
   - Node 18 for building React app
   - Nginx Alpine for serving static files
   - Production-optimized

4. **`web/nginx.conf`** - Nginx configuration
   - **Domain**: `immigrationai.website` and `www.immigrationai.website`
   - API proxy to backend (port 3001)
   - SPA routing support
   - Gzip compression
   - Static asset caching (1 year)
   - Security headers
   - 50MB max upload size
   - Extended timeouts for long operations (index rebuild)

### Initialization Scripts

5. **`server/entrypoint.sh`** - Backend startup script
   - Waits for PostgreSQL to be ready
   - Auto-creates admin user (`admin@hotmail.com` / `admin`)
   - Starts FastAPI server

6. **`db/create_userdb.sh`** - Database initialization
   - Creates all tables (users, chat_history, memories, etc.)
   - Docker-compatible with environment variables
   - Idempotent (safe to run multiple times)

### SSL/HTTPS Configuration

7. **`nginx-ssl.conf.example`** - HTTPS nginx config
   - HTTP to HTTPS redirect
   - SSL certificate configuration
   - Enhanced security headers
   - TLS 1.2/1.3 support

8. **`docker-compose.ssl.yml`** - SSL override
   - Adds port 443 for HTTPS
   - Certbot service for auto-renewal
   - Certificate volume mounts

9. **`setup-ssl.sh`** - Automated SSL setup script
   - Installs Certbot
   - Obtains Let's Encrypt certificates
   - Configures auto-renewal cron job
   - Updates nginx configuration
   - Restarts services with SSL

### Configuration & Documentation

10. **`.env.example`** - Environment template
    - OpenAI API keys
    - Database credentials
    - JWT secret configuration

11. **`.gitignore`** - Git ignore rules
    - Excludes `.env`, node_modules, venv
    - Excludes build artifacts
    - Excludes user data and PDFs

12. **`.dockerignore`** - Docker ignore rules
    - Excludes unnecessary files from images
    - Reduces build context size

13. **`README.md`** - Main documentation
    - Quick start guide
    - Tech stack overview
    - Project structure
    - API endpoints
    - Configuration details

14. **`DEPLOYMENT.md`** - Deployment guide
    - Step-by-step VPS setup
    - Security recommendations
    - CI/CD configuration
    - Monitoring and maintenance
    - Troubleshooting

15. **`.github/workflows/deploy.yml`** - GitHub Actions CI/CD
    - Auto-deploy on push to main
    - SSH-based deployment
    - Automatic index rebuild

## 🚀 Quick Start Commands

### First Time Setup

```bash
# 1. Clone repository on your VPS
git clone https://github.com/yourusername/leann.git
cd leann

# 2. Configure environment
cp .env.example .env
nano .env  # Add your OpenAI API keys

# 3. Start services (database auto-initializes)
docker-compose up -d

# 4. Check logs
docker-compose logs -f

# 5. Access application
# HTTP: http://your-vps-ip or http://immigrationai.website
# Admin: http://your-vps-ip/admin (admin@hotmail.com / admin)
```

### SSL/HTTPS Setup (Run on VPS)

```bash
# Edit email in setup-ssl.sh first
sudo ./setup-ssl.sh

# Now accessible at:
# https://immigrationai.website
# https://www.immigrationai.website
```

### Day-to-Day Operations

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Rebuild LEANN index
docker-compose exec backend python3 /app/src/utils/leann_converter.py

# Database backup
docker-compose exec postgres pg_dump -U useradmin userdb > backup.sql
```

## 🔧 Configuration Details

### Database (PostgreSQL)
- **Host**: `postgres` (Docker service name)
- **Port**: `5432`
- **User**: `useradmin`
- **Password**: `userdb1234` (change in production!)
- **Database**: `userdb`

### Backend (FastAPI)
- **Internal Port**: `3001`
- **External Port**: `3001` (mapped)
- **Health Check**: `GET /api/health`
- **API Base**: `/api`

### Frontend (React + Nginx)
- **HTTP Port**: `80` (mapped)
- **HTTPS Port**: `443` (when SSL enabled)
- **Domain**: `immigrationai.website`, `www.immigrationai.website`
- **Build**: Vite production build
- **Server**: Nginx Alpine

## 📁 Directory Structure

```
leann/
├── docker-compose.yml          # Main Docker orchestration
├── docker-compose.ssl.yml      # SSL configuration override
├── .env                        # Environment variables (DO NOT COMMIT)
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── .dockerignore              # Docker ignore rules
├── README.md                  # Main documentation
├── DEPLOYMENT.md              # Deployment guide
├── DOCKER_SETUP.md           # This file
├── setup-ssl.sh              # SSL setup script
├── nginx-ssl.conf.example    # HTTPS nginx config
├── server/
│   ├── Dockerfile            # Backend image
│   ├── entrypoint.sh         # Initialization script
│   ├── main.py               # FastAPI application
│   ├── requirements.txt      # Python dependencies
│   └── .dockerignore
├── web/
│   ├── Dockerfile            # Frontend image
│   ├── nginx.conf            # Nginx configuration
│   ├── package.json
│   ├── src/                  # React source code
│   └── .dockerignore
├── db/
│   └── create_userdb.sh      # Database initialization
├── src/
│   ├── scripts/              # Chat API, wrappers
│   └── utils/                # Document processing, RAG
├── data/                     # PDF documents & LEANN index
├── certbot/                  # SSL certificates (created by setup)
│   ├── conf/                 # Let's Encrypt config
│   └── www/                  # ACME challenge files
└── .github/
    └── workflows/
        └── deploy.yml        # CI/CD pipeline
```

## 🔐 Security Checklist

- [ ] Change default database password in `.env`
- [ ] Set strong JWT_SECRET_KEY (32+ random characters)
- [ ] Change admin password after first login
- [ ] Set up SSL/HTTPS with `./setup-ssl.sh`
- [ ] Configure firewall (UFW)
- [ ] Restrict `.env` file permissions (`chmod 600 .env`)
- [ ] Enable fail2ban for SSH protection
- [ ] Set up regular database backups
- [ ] Monitor logs for suspicious activity

## 🌐 Domain Configuration

### DNS Settings for immigrationai.website

Configure these DNS records with your domain registrar:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | `your-vps-ip` | 3600 |
| A | www | `your-vps-ip` | 3600 |

Wait 5-60 minutes for DNS propagation, then run `./setup-ssl.sh`

## 📊 Service Ports

| Service | Internal Port | External Port | Access |
|---------|---------------|---------------|--------|
| PostgreSQL | 5432 | 5432 | localhost only |
| Backend | 3001 | 3001 | All interfaces |
| Frontend (HTTP) | 80 | 80 | All interfaces |
| Frontend (HTTPS) | 443 | 443 | All interfaces (after SSL) |

## 🔄 CI/CD Setup

### GitHub Repository Secrets

Add these secrets to your GitHub repository settings:

1. **`VPS_HOST`**: Your VPS IP address (e.g., `123.45.67.89`)
2. **`VPS_USER`**: SSH username (e.g., `root`)
3. **`VPS_SSH_KEY`**: Private SSH key for authentication
4. **`APP_PATH`**: Application directory on VPS (e.g., `/root/leann`)

### Auto-Deployment

Every push to `main` branch automatically:
1. Pulls latest code on VPS
2. Rebuilds Docker images
3. Restarts services
4. Rebuilds LEANN index
5. Cleans up old images

## 🧪 Testing

```bash
# Test database connection
docker-compose exec postgres psql -U useradmin -d userdb -c "SELECT version();"

# Test backend health
curl http://localhost:3001/api/health

# Test admin login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotmail.com","password":"admin"}'

# Test frontend
curl -I http://localhost

# Test HTTPS (after SSL setup)
curl -I https://immigrationai.website
```

## 📈 Monitoring

### View Service Status
```bash
docker-compose ps
docker stats
```

### Check Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Resource Usage
```bash
# Docker resource usage
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

## 🐛 Common Issues

### "Port already in use"
```bash
# Find and stop conflicting service
sudo lsof -i :80
sudo lsof -i :3001
```

### "Database connection refused"
```bash
# Check PostgreSQL health
docker-compose ps postgres
docker-compose logs postgres
docker-compose restart postgres
```

### "502 Bad Gateway"
```bash
# Backend not responding
docker-compose logs backend
docker-compose restart backend
```

### SSL certificate issues
```bash
# Test certificate renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

## ✅ Success Indicators

- [ ] `docker-compose ps` shows all services as "Up" and "healthy"
- [ ] `curl http://localhost:3001/api/health` returns `{"status":"healthy"}`
- [ ] Can access frontend at http://your-vps-ip
- [ ] Can login to admin dashboard at http://your-vps-ip/admin
- [ ] Documents upload successfully
- [ ] Index rebuild completes without errors
- [ ] Chat responds correctly
- [ ] (After SSL) HTTPS redirects work and shows valid certificate

## 🎉 Next Steps

1. **Upload Documents**: Place PDF files in `./data/` directory
2. **Build Index**: Login to admin dashboard → Document Management → Rebuild Index
3. **Test Chat**: Login as regular user and test chatbot
4. **Setup SSL**: Run `./setup-ssl.sh` for HTTPS
5. **Monitor**: Check logs and admin dashboard regularly
6. **Backup**: Set up automated database backups

## 📞 Support

- Check logs first: `docker-compose logs -f`
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guides
- Check [README.md](./README.md) for API documentation
- Open GitHub issue if problem persists

---

**Your application is now containerized and ready for production deployment!** 🚀
