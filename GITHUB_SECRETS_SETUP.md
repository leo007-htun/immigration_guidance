# GitHub Secrets Setup Guide

Complete guide for setting up GitHub repository secrets for automated deployment to IONOS VPS.

## Required Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 1. VPS Connection Secrets (Required)

| Secret Name | Description | Example | How to Get |
|-------------|-------------|---------|------------|
| **VPS_HOST** | VPS IP address | `123.45.67.89` | IONOS control panel or `curl ifconfig.me` on VPS |
| **VPS_USER** | SSH username | `root` | Usually `root` for IONOS VPS |
| **VPS_SSH_KEY** | Private SSH key | `-----BEGIN OPENSSH...` | `cat ~/.ssh/id_rsa` |

### 2. Application Secrets (Required)

| Secret Name | Description | Example | How to Get |
|-------------|-------------|---------|------------|
| **OPENAI_API_KEY** | OpenAI API key | `sk-proj-...` | https://platform.openai.com/api-keys |
| **ADMIN_KEY** | OpenAI API key (admin) | `sk-admin-...` | Same as above (for usage tracking) |
| **JWT_SECRET_KEY** | JWT secret for auth | `abc123...` | Generate: `openssl rand -hex 32` |

### 3. Optional Secrets (Have Defaults)

| Secret Name | Default Value | Description |
|-------------|---------------|-------------|
| **APP_PATH** | `/root/leann` | Application directory on VPS |
| **DOMAIN** | `immigrationai.website` | Your domain name |
| **SSL_EMAIL** | `admin@immigrationai.website` | Email for Let's Encrypt |
| **ORG_ID** | _(none)_ | OpenAI organization ID |
| **DATABASE_PASSWORD** | `userdb1234` | PostgreSQL password |
| **VPS_PORT** | `22` | SSH port |

## Step-by-Step Setup

### Step 1: Generate JWT Secret

On your local machine:
```bash
openssl rand -hex 32
```
Copy the output (64 characters)

### Step 2: Get SSH Private Key

On your local machine:
```bash
# View your SSH private key
cat ~/.ssh/id_rsa

# If you don't have one, generate it:
ssh-keygen -t rsa -b 4096 -C "github-deploy"

# Copy public key to VPS
ssh-copy-id root@YOUR_VPS_IP
```

Copy the **entire private key** including:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...entire key content...
-----END OPENSSH PRIVATE KEY-----
```

### Step 3: Get OpenAI API Keys

1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy the key (starts with `sk-proj-...` or `sk-...`)
4. Use same key for both `OPENAI_API_KEY` and `ADMIN_KEY`

### Step 4: Add Secrets to GitHub

For each secret:
1. Go to your repository on GitHub
2. Click **Settings**
3. In left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter **Name** and **Secret**
6. Click **Add secret**

## Quick Reference Table

### Minimum Required Secrets (6 total)

```
VPS_HOST           = 123.45.67.89
VPS_USER           = root
VPS_SSH_KEY        = -----BEGIN OPENSSH PRIVATE KEY-----...
OPENAI_API_KEY     = sk-proj-abc123...
ADMIN_KEY          = sk-proj-abc123...
JWT_SECRET_KEY     = f4a2b9c8d1e3f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9
```

### All Secrets (Complete Setup)

```
# Required VPS Connection
VPS_HOST           = 123.45.67.89
VPS_USER           = root
VPS_SSH_KEY        = -----BEGIN OPENSSH PRIVATE KEY-----...

# Required Application Keys
OPENAI_API_KEY     = sk-proj-abc123...
ADMIN_KEY          = sk-admin-abc123...
JWT_SECRET_KEY     = f4a2b9c8d1e3f5a6b7c8d9e0f1a2b3c4...

# Optional (uses defaults if not set)
APP_PATH           = /root/leann
DOMAIN             = immigrationai.website
SSL_EMAIL          = admin@immigrationai.website
ORG_ID             = org-abc123...
DATABASE_PASSWORD  = your-secure-password
VPS_PORT           = 22
```

## What Happens on Push

When you push to `main` branch, GitHub Actions will automatically:

1. ✅ Connect to your VPS via SSH
2. ✅ Clone/pull the repository
3. ✅ Create `.env` file with all secrets
4. ✅ Obtain SSL certificates (Let's Encrypt)
5. ✅ Build Docker images
6. ✅ Start all services (PostgreSQL, Backend, Frontend, Certbot)
7. ✅ Initialize database (auto-create tables)
8. ✅ Create admin user (`admin@hotmail.com` / `admin`)
9. ✅ Build LEANN index (if PDFs exist)
10. ✅ Setup SSL auto-renewal

**Total time: ~5-10 minutes**

## First-Time Deployment Checklist

Before pushing to GitHub:

- [ ] Configure VPS firewall (ports 22, 80, 443)
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```

- [ ] Install Docker & Docker Compose on VPS
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo apt install docker-compose -y
  ```

- [ ] Configure DNS (wait for propagation)
  ```
  A Record: immigrationai.website → YOUR_VPS_IP
  A Record: www.immigrationai.website → YOUR_VPS_IP
  ```

- [ ] Add all 6 required secrets to GitHub

- [ ] Push to `main` branch and watch Actions tab

## Testing the Setup

After secrets are configured:

1. Push a test commit:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. Watch the deployment:
   - Go to **Actions** tab in GitHub
   - Click on the running workflow
   - Monitor the logs in real-time

3. After ~5-10 minutes, visit:
   - https://www.immigrationai.website
   - https://www.immigrationai.website/admin

## Troubleshooting

### "Permission denied (publickey)"
- Make sure `VPS_SSH_KEY` contains the **private key** (not public key)
- Verify the public key is in VPS: `~/.ssh/authorized_keys`

### "Could not resolve host"
- Check `VPS_HOST` is correct IP address
- No `http://`, just numbers: `123.45.67.89`

### SSL certificate failed
- Verify DNS is configured and propagated
- Check ports 80 and 443 are open in firewall
- Domain must resolve to VPS IP before SSL setup

### .env file issues
- Make sure all required secrets are set in GitHub
- Check for typos in secret names

## Security Notes

- ✅ Never commit `.env` file to repository
- ✅ Never share private SSH keys publicly
- ✅ Rotate SSH keys periodically
- ✅ Use strong passwords for database
- ✅ Keep GitHub secrets secure
- ✅ Review GitHub Actions logs (they hide secrets automatically)

## After First Deployment

1. **Change admin password**
   - Login: https://www.immigrationai.website/admin
   - Email: `admin@hotmail.com`
   - Password: `admin`
   - Change it immediately!

2. **Upload PDF documents**
   - SSH to VPS: `ssh root@YOUR_VPS_IP`
   - Upload PDFs: `scp file.pdf root@YOUR_VPS_IP:/root/leann/data/`
   - Rebuild index via admin dashboard

3. **Monitor logs**
   ```bash
   ssh root@YOUR_VPS_IP
   cd /root/leann
   docker-compose logs -f
   ```

## Support

- 📖 Deployment guide: [DEPLOYMENT.md](./DEPLOYMENT.md)
- 🐳 Docker setup: [DOCKER_SETUP.md](./DOCKER_SETUP.md)
- 🚀 Quick deploy: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)

---

**Once configured, every push to `main` automatically deploys to production!** 🚀
