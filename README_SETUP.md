# LEANN Chat Application - Setup Guide

This guide explains how to run the complete LEANN chat application with authentication.

## Architecture

The application consists of three main components:

1. **Frontend (React + Vite)** - Port 5173
   - User interface with login/signup
   - Chat interface
   - Located in `/web`

2. **Backend (FastAPI)** - Port 3001
   - Authentication (JWT-based)
   - Chat API endpoints
   - Integrates with LeannChat
   - Located in `/server`

3. **LeannChat API** - Python module
   - Core chat functionality
   - Per-user memory management (Memori)
   - Document retrieval (RAG)
   - Located in `/src/scripts`

## Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL (for user database)
- OpenAI API key

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with:

```env
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET_KEY=your_secret_key_for_jwt
```

### 2. Database Setup

Run the database creation script:

```bash
./create_userdb.sh
```

This creates the PostgreSQL database for Memori user data.

### 3. Backend Setup

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Or use the startup script:

```bash
chmod +x start_backend.sh
./start_backend.sh
```

The backend will start on `http://localhost:3001`

### 4. Frontend Setup

Install Node dependencies and start:

```bash
cd web
npm install
npm run dev
```

Or use the startup script:

```bash
chmod +x start_frontend.sh
./start_frontend.sh
```

The frontend will start on `http://localhost:5173`

## How It Works

### Authentication Flow

1. User signs up or logs in through the UI
2. Backend validates credentials and creates JWT tokens
3. Tokens are stored in localStorage
4. User info including `user_id` is stored

### Chat Flow

1. User sends a message through the chat interface
2. Frontend sends message + JWT token to `/api/chat/message`
3. Backend:
   - Validates JWT token
   - Extracts `user_id` from token
   - Creates/retrieves `LeannChatAPI` instance for that user
   - Calls `chat_api.ask(message)`
4. LeannChat:
   - Uses user-specific `user_id` for Memori
   - Retrieves relevant documents
   - Generates response using OpenAI
5. Response is sent back to UI with sources

### User Isolation

Each user gets:
- Unique `user_id` (UUID generated at signup)
- Separate Memori instance for memory management
- Isolated chat history and session data
- User-specific directory in `/db/users/{user_id}`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Chat

- `POST /api/chat/message` - Send chat message (requires auth)
- `GET /api/chat/history` - Get chat history (requires auth)
- `DELETE /api/chat/conversation/{id}` - Delete conversation (requires auth)

## Development

### Running Both Services

Open two terminal windows:

Terminal 1 (Backend):
```bash
./start_backend.sh
```

Terminal 2 (Frontend):
```bash
./start_frontend.sh
```

Then open `http://localhost:5173` in your browser.

### Testing the Flow

1. Click "Sign Up" and create an account
2. After signup, you'll be logged in automatically
3. Start chatting - your messages will go through:
   - Frontend → Backend → LeannChat → OpenAI
4. Each user gets isolated memory and chat history

### Troubleshooting

**Backend won't start:**
- Check if port 3001 is available
- Verify PostgreSQL is running
- Check `.env` file exists with OPENAI_API_KEY

**Frontend won't connect:**
- Verify backend is running on port 3001
- Check browser console for CORS errors
- Ensure API_BASE_URL in `web/src/services/api.ts` and `web/src/services/chatApi.ts` is correct

**Chat errors:**
- Verify OpenAI API key is valid
- Check if index data exists in `/data/index`
- Look at backend logs for detailed error messages

## Production Considerations

Before deploying to production:

1. **Security:**
   - Change JWT_SECRET_KEY to a strong random value
   - Use environment variables for all secrets
   - Enable HTTPS
   - Implement rate limiting

2. **Database:**
   - Replace in-memory user storage with PostgreSQL/MongoDB
   - Add proper user table schema
   - Implement database migrations

3. **Performance:**
   - Add Redis for session management
   - Implement connection pooling
   - Add caching for frequently asked questions

4. **Monitoring:**
   - Add logging
   - Implement error tracking (Sentry)
   - Add metrics and monitoring

## File Structure

```
leann/
├── server/
│   └── main.py              # FastAPI backend
├── src/
│   └── scripts/
│       ├── leann_chat.py         # Original standalone script
│       └── leann_chat_api.py     # API wrapper with dynamic user_id
├── web/
│   └── src/
│       ├── components/           # React components
│       └── services/
│           ├── api.ts           # Auth API client
│           └── chatApi.ts       # Chat API client
├── data/
│   └── index/               # LEANN index files
├── db/
│   └── users/               # Per-user data directories
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
├── start_backend.sh         # Backend startup script
└── start_frontend.sh        # Frontend startup script
```
