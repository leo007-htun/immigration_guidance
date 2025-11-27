# LEANN Immigration Chatbot

A multi-user immigration chatbot system with admin dashboard, built with FastAPI, React, and LEANN RAG technology.

## ✨ Features

- **Multi-user Authentication**: Secure JWT-based authentication with user isolation
- **RAG-powered Chatbot**: Uses LEANN for efficient document retrieval and Q&A
- **Memori Integration**: Short-term and long-term memory for context-aware conversations
- **Admin Dashboard**:
  - User management and statistics
  - OpenAI usage and cost tracking
  - Document management with index rebuilding
  - Chat history and memory insights
- **Fully Dockerized**: Easy deployment with Docker Compose

## 🏗️ Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **Frontend**: React 18 + TypeScript + Vite
- **Database**: PostgreSQL 15
- **RAG**: LEANN (Local Efficient Approximate Nearest Neighbors)
- **Memory**: Memori for conversation memory management
- **LLM**: OpenAI GPT-4.1-mini
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/leann.git
   cd leann
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API keys
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Admin Dashboard: http://localhost/admin
   - Backend API: http://localhost:3001
   - Admin credentials: `admin@hotmail.com` / `admin`

5. **Upload documents and build index**
   - Place PDF files in `./data/` directory
   - Login to admin dashboard
   - Go to "Document Management"
   - Click "Rebuild Index"

### Production Deployment (IONOS VPS)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 📁 Project Structure

```
leann/
├── server/              # FastAPI backend
│   ├── main.py         # Main API endpoints
│   ├── Dockerfile      # Backend Docker image
│   ├── entrypoint.sh   # Initialization script
│   └── requirements.txt
├── web/                # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   └── services/   # API services
│   ├── Dockerfile      # Frontend Docker image
│   └── nginx.conf      # Nginx configuration
├── src/                # Python utilities
│   ├── scripts/        # Chat API and wrappers
│   └── utils/          # Document processing, RAG
├── db/                 # Database scripts
│   └── create_userdb.sh # DB initialization
├── data/               # Document storage
├── docker-compose.yml  # Docker orchestration
└── .env.example        # Environment template
```

## 🔧 Configuration

### Environment Variables

Key variables in `.env`:

```env
# OpenAI
OPENAI_API_KEY=sk-proj-...
ADMIN_KEY=sk-admin-...   # For usage tracking
ORG_ID=org-...           # Optional

# Security
JWT_SECRET_KEY=your-secret-key

# Database (Docker defaults)
DATABASE_HOST=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
```

### Chat Configuration

Edit `src/scripts/leann_chat_api.py`:

```python
# LLM model
llm_config={"type": "openai", "model": "gpt-4.1-mini", "max_tokens": 500}

# Memory settings
memori = Memori(model="gpt-4o-mini", conscious_ingest=True)
```

## 🔐 Admin Dashboard

Access at `/admin` with credentials:
- Email: `admin@hotmail.com`
- Password: `admin` (change after first login!)

Features:
- **System Stats**: Users, conversations, memory metrics
- **Usage & Cost**: OpenAI token usage and cost tracking (7/30/90 days)
- **User Management**: View all users, chat counts, memory stats
- **Document Management**: Upload PDFs, rebuild LEANN index

## 🗄️ Database Schema

Main tables:
- `users`: User accounts with admin flag
- `chat_history`: All conversation exchanges
- `short_term_memory`: Temporary conversation context
- `long_term_memory`: Persistent important information
- `refresh_tokens`: JWT refresh tokens

See `db/create_userdb.sh` for full schema.

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token

### Chat
- `POST /api/chat` - Send message to chatbot

### Admin (requires `is_admin=true`)
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - List all users
- `GET /api/admin/usage-cost?days=7` - OpenAI usage & cost
- `GET /api/documents/list` - List documents
- `POST /api/documents/upload` - Upload PDF
- `POST /api/documents/rebuild-index` - Rebuild LEANN index

## 🧪 Testing

```bash
# Backend tests
cd server
pytest

# Frontend tests
cd web
npm test

# Test admin API
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/admin/stats
```

## 📦 CI/CD

GitHub Actions workflow included (`.github/workflows/deploy.yml`).

**Required Secrets**:
- `VPS_HOST`: VPS IP address
- `VPS_USER`: SSH username
- `VPS_SSH_KEY`: SSH private key
- `APP_PATH`: Application path on VPS (default: `/root/leann`)

Push to `main` branch to trigger auto-deployment.

## 🛠️ Maintenance

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Backup Database
```bash
docker-compose exec postgres pg_dump -U useradmin userdb > backup.sql
```

### Update Application
```bash
git pull origin main
docker-compose build
docker-compose up -d
```

### Rebuild LEANN Index
```bash
docker-compose exec backend python3 /app/src/utils/leann_converter.py
```

## 🐛 Troubleshooting

**Database connection errors:**
- Check `docker-compose ps` - ensure postgres is healthy
- Check database logs: `docker-compose logs postgres`

**Frontend 502 errors:**
- Check backend health: `curl http://localhost:3001/api/health`
- Restart: `docker-compose restart backend`

**Index build fails:**
- Verify PDFs in `./data/` directory
- Check permissions: `ls -la data/`
- Check logs: `docker-compose logs backend`

## 📝 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Contact

For support, open an issue on GitHub.

---

**Note**: Remember to change the default admin password and secure your `.env` file in production!
