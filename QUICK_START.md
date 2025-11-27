# LEANN Chat - Quick Start Guide

## What Was Built

A complete full-stack chat application that integrates:

1. ✅ **React Frontend** with login/signup UI
2. ✅ **JWT Authentication** system
3. ✅ **FastAPI Backend** server
4. ✅ **Dynamic user_id** from auth → leann_chat.py
5. ✅ **LeannChat integration** with user-specific memory
6. ✅ **Complete data flow** from UI to AI response

## Quick Start (3 Steps)

### Step 1: Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node dependencies
cd web && npm install && cd ..
```

### Step 2: Configure Environment

Make sure `.env` file exists with:
```env
OPENAI_API_KEY=your_key_here
JWT_SECRET_KEY=your_secret_key_here
```

### Step 3: Run the Application

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

**Browser:**
Open `http://localhost:5173`

## How to Use

1. **Sign Up**: Create an account with email/password
2. **Chat**: Start asking questions about immigration/visa rules
3. **Sources**: View source documents for each response

## How It Works (The Integration)

```
User Login
    ↓
JWT Token Created (contains user_id)
    ↓
User Sends Chat Message (with JWT)
    ↓
Backend Validates JWT & Extracts user_id
    ↓
LeannChatAPI Initialized with user_id
    ↓
Memori Created with user_id (isolated memory)
    ↓
LeannChat Processes Query
    ↓
OpenAI Generates Response
    ↓
Response Sent Back to UI
```

## Key Files Created/Modified

### Backend
- **`server/main.py`** - FastAPI server with auth + chat endpoints
- **`src/scripts/leann_chat_api.py`** - API wrapper accepting dynamic user_id

### Configuration
- **`requirements.txt`** - Updated with FastAPI dependencies
- **`web/src/services/chatApi.ts`** - Updated to use port 3001

### Documentation
- **`README_SETUP.md`** - Complete setup guide
- **`INTEGRATION_GUIDE.md`** - Detailed integration explanation
- **`QUICK_START.md`** - This file

### Scripts
- **`start_backend.sh`** - Start FastAPI server
- **`start_frontend.sh`** - Start React/Vite dev server
- **`test_integration.py`** - Verify setup before running

## Test the Integration

Run the test script to verify everything is configured:

```bash
python3 test_integration.py
```

Expected output:
```
✓ All checks passed! You're ready to start the servers.
```

## The Authentication → user_id Flow

### 1. User Signs Up/Logs In
```typescript
// Frontend: web/src/components/LoginPage.tsx
await api.login({ email, password })
```

### 2. Backend Creates JWT with user_id
```python
# Backend: server/main.py
user_id = str(uuid.uuid4())  # Generated at signup
access_token = create_access_token({
    "sub": user_id,  # user_id embedded in token
    "email": email
})
```

### 3. Every Chat Request Includes JWT
```typescript
// Frontend: web/src/services/chatApi.ts
fetch('/api/chat/message', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
```

### 4. Backend Extracts user_id from JWT
```python
# Backend: server/main.py
async def get_current_user(credentials):
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")  # Extract user_id
    return users_db[user_id]
```

### 5. LeannChatAPI Gets user_id
```python
# Backend: server/main.py
@app.post("/api/chat/message")
async def send_chat_message(current_user: dict):
    user_id = current_user["id"]  # ← This is passed to leann_chat.py
    chat_api = get_or_create_chat_instance(user_id)
```

### 6. Memori Uses user_id
```python
# src/scripts/leann_chat_api.py
class LeannChatAPI:
    def __init__(self, user_id: str):  # ← Dynamic user_id!
        self.memory = Memori(
            user_id=user_id,  # ← User-specific memory
            session_id=session_id,
            ...
        )
```

## User Isolation

Each user gets:
- ✅ Unique UUID as user_id
- ✅ Separate LeannChatAPI instance
- ✅ Isolated Memori memory
- ✅ Individual chat history
- ✅ Personal directory: `db/users/{user_id}/`

## API Endpoints

### Authentication (Port 3001)
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Chat (Port 3001)
- `POST /api/chat/message` - Send message (requires auth)
- `GET /api/chat/history` - Get history (requires auth)

## Troubleshooting

### Backend won't start
```bash
# Check port availability
lsof -i :3001

# Check dependencies
pip install -r requirements.txt

# Check .env file exists
cat .env
```

### Frontend won't connect
```bash
# Verify backend is running
curl http://localhost:3001/

# Check frontend config
grep API_BASE_URL web/src/services/*.ts
```

### Chat not working
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Check data/index exists
ls -la data/index/

# View backend logs for errors
```

## Example Usage

### 1. Create Account
- Open http://localhost:5173
- Click "Sign Up"
- Enter: test@example.com / password123
- Auto-logged in after signup

### 2. Send First Message
- Type: "What are H1-B visa requirements?"
- See AI response with source documents
- Your user_id is being used behind the scenes!

### 3. Verify User Isolation
- Logout (click logout button)
- Create another account: test2@example.com
- Chat history is separate for each user

## What Happens Behind the Scenes

When you send "What are H1-B visa requirements?":

1. **Frontend** sends message + JWT token
2. **Backend** decodes JWT → gets your user_id (e.g., "abc-123-def")
3. **LeannChatAPI** initializes with user_id="abc-123-def"
4. **Memori** loads YOUR memory (not other users')
5. **LeannChat** retrieves relevant documents
6. **OpenAI** generates response
7. **Response** sent back to UI with sources
8. **UI** displays message with source documents

All isolated to YOUR user_id!

## Next Steps

### For Development
1. Add more documents to `data/index/`
2. Customize chat UI in `web/src/components/ChatInterface.tsx`
3. Add chat history features
4. Implement conversation management

### For Production
1. Replace in-memory user storage with PostgreSQL
2. Add email verification
3. Implement rate limiting
4. Enable HTTPS
5. Add monitoring and logging
6. Deploy to cloud (AWS, GCP, Azure)

## Support

- **Setup Issues**: See `README_SETUP.md`
- **Integration Details**: See `INTEGRATION_GUIDE.md`
- **Test Configuration**: Run `./test_integration.py`

## Summary

You now have a complete authentication-aware chat system where:

✅ Users sign up and get unique IDs
✅ JWT tokens carry user_id securely
✅ Backend extracts user_id from tokens
✅ **user_id is passed to leann_chat.py**
✅ Each user gets isolated memory and chat
✅ Responses integrate seamlessly in the UI

The hardcoded `user_id = "2d9b104a..."` in the original leann_chat.py is now **dynamic** and comes from the authenticated user!

Enjoy your fully integrated LEANN chat application! 🚀
