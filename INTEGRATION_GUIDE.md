# LEANN Chat - Complete Integration Guide

## Overview

This document explains the complete integration between the web UI, authentication system, and leann_chat.py.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                            │
│                    (http://localhost:5173)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ HTTP Requests + JWT Token
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    FastAPI Backend Server                       │
│                    (http://localhost:3001)                      │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────┐        │
│  │  Auth Endpoints  │         │   Chat Endpoints     │        │
│  │  - /auth/signup  │         │  - /chat/message     │        │
│  │  - /auth/login   │         │  - /chat/history     │        │
│  │  - /auth/refresh │         │                      │        │
│  └──────────────────┘         └──────────┬───────────┘        │
│                                           │                     │
│                              Extracts user_id from JWT          │
│                                           │                     │
└───────────────────────────────────────────┼─────────────────────┘
                                            │
                                            │ user_id
                                            │
┌───────────────────────────────────────────▼─────────────────────┐
│                      LeannChatAPI                               │
│                  (src/scripts/leann_chat_api.py)                │
│                                                                 │
│  - Initialized per user with user_id                           │
│  - Creates Memori instance with user_id                        │
│  - Maintains session state                                     │
│  - Provides ask() method for queries                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              │ Queries + Context
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                       LeannChat + Memori                        │
│                                                                 │
│  - Retrieves relevant documents (RAG)                          │
│  - Uses OpenAI for response generation                         │
│  - Stores conversation in user-specific memory                 │
│  - Returns response with sources                               │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Complete Example

### 1. User Signup/Login

**Frontend (LoginPage.tsx)**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  const response = await api.login({ email, password });
  // response contains: { user, accessToken, refreshToken }
  onLogin();
};
```

**Backend (server/main.py)**
```python
@app.post("/api/auth/login")
async def login(request: LoginRequest):
    # Verify credentials
    user_id = verify_user(email, password)

    # Create JWT with user_id embedded
    access_token = create_access_token({
        "sub": user_id,
        "email": email
    })

    return AuthResponse(
        user=User(id=user_id, email=email),
        accessToken=access_token,
        refreshToken=refresh_token
    )
```

### 2. Sending a Chat Message

**Frontend (ChatInterface.tsx)**
```typescript
const handleSend = async () => {
  // Sends message with JWT token in Authorization header
  const response = await chatApi.sendMessage(userQuestion);

  // response contains: { response, sources, conversation_id }
  setMessages([...messages, botResponse]);
};
```

**Frontend API Client (chatApi.ts)**
```typescript
async sendMessage(message: string): Promise<ChatResponse> {
  const token = localStorage.getItem('accessToken');

  return fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
}
```

**Backend Authentication (server/main.py)**
```python
async def get_current_user(credentials: HTTPAuthorizationCredentials):
    token = credentials.credentials
    payload = decode_token(token)  # Validates JWT
    user_id = payload.get("sub")   # Extract user_id from token
    return users_db[user_id]
```

**Backend Chat Endpoint (server/main.py)**
```python
@app.post("/api/chat/message")
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)  # JWT validated here
):
    user_id = current_user["id"]  # Get user_id from authenticated user

    # Get or create LeannChatAPI instance for THIS user
    chat_api = get_or_create_chat_instance(user_id)

    # Get response from LEANN with user's context
    response = chat_api.ask(request.message, top_k=3)

    return ChatResponse(
        response=response['answer'],
        sources=response['sources']
    )
```

**LeannChatAPI Initialization (leann_chat_api.py)**
```python
class LeannChatAPI:
    def __init__(self, user_id: str):
        self.user_id = user_id  # DYNAMIC user_id from auth
        self.session_id = StringUtils.generate_id("session_")

        # Create Memori with THIS user's ID
        self.memory = Memori(
            database_connect="postgresql://...",
            user_id=user_id,  # User-specific memory
            session_id=self.session_id,
            conscious_ingest=True,
            verbose=False,
            model="gpt-4.1-mini"
        )

        # Initialize LeannChat
        self.chat = LeannChat(
            INDEX_PATH,
            llm_config={"type": "openai", "model": "gpt-4.1-mini"}
        )
```

### 3. User-Specific Data Storage

Each user gets isolated storage:

```
db/users/
├── 2d9b104a-7aa7-40f6-84d6-cb789137c6f4/  # User 1's data
│   ├── session_abc123/
│   └── memory/
├── 8f3e2c1a-9b7d-4e5f-a6c8-1d2e3f4a5b6c/  # User 2's data
│   ├── session_def456/
│   └── memory/
└── ...
```

PostgreSQL database stores:
- User conversations (per user_id)
- Short-term memory (per session_id)
- Long-term memory (per user_id)

## Key Integration Points

### 1. **Authentication → user_id Extraction**

File: `server/main.py`

The JWT token contains the user_id in the "sub" claim:

```python
def create_access_token(data: dict) -> str:
    to_encode = {"sub": user_id, "email": email, ...}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials):
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")  # THIS is the user_id
    return users_db[user_id]
```

### 2. **user_id → LeannChatAPI Instance**

File: `server/main.py`

Each user gets their own LeannChatAPI instance:

```python
user_chat_instances = {}  # Cache of user instances

def get_or_create_chat_instance(user_id: str) -> LeannChatAPI:
    if user_id not in user_chat_instances:
        user_chat_instances[user_id] = LeannChatAPI(user_id)
    return user_chat_instances[user_id]
```

### 3. **LeannChatAPI → Memori with user_id**

File: `src/scripts/leann_chat_api.py`

```python
class LeannChatAPI:
    def __init__(self, user_id: str):
        self.memory = Memori(
            user_id=user_id,  # Isolates memory per user
            session_id=self.session_id,
            ...
        )
```

### 4. **Response → UI Display**

File: `web/src/components/ChatInterface.tsx`

```typescript
const response = await chatApi.sendMessage(userQuestion);

const botResponse: Message = {
  text: response.response,      // The answer
  sources: response.sources,    // Source documents
  sender: 'bot',
  timestamp: new Date()
};

setMessages([...messages, botResponse]);
```

## Running the Application

### Terminal 1: Backend
```bash
./start_backend.sh
```

Expected output:
```
Starting LEANN Backend Server...
Installing dependencies...
Starting FastAPI server on port 3001...
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:3001
```

### Terminal 2: Frontend
```bash
./start_frontend.sh
```

Expected output:
```
Starting LEANN Frontend...
Starting Vite dev server...
VITE v4.x.x  ready in 500 ms
➜  Local:   http://localhost:5173/
```

### Using the Application

1. Open `http://localhost:5173`
2. Click "Sign Up" and create account (email + password)
3. After signup, you're automatically logged in
4. Start chatting in the chat interface
5. Each message goes through the full flow:
   - Frontend → Backend (with JWT)
   - Backend extracts your user_id
   - Creates/gets your LeannChatAPI instance
   - Queries LEANN with your user context
   - Returns response to UI

## Testing the Integration

### Test 1: User Isolation

```bash
# Create two different users
User A: alice@example.com
User B: bob@example.com

# Both users ask the same question
# They will get isolated memory and chat history
```

### Test 2: JWT Authentication

```bash
# Try accessing chat without login
curl http://localhost:3001/api/chat/message
# Should return 401 Unauthorized

# Login first
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' \
  | jq -r '.accessToken')

# Use token to chat
curl -X POST http://localhost:3001/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the visa requirements?"}'
```

### Test 3: user_id Propagation

Check the backend logs to see the user_id being used:

```python
# Add this to server/main.py in send_chat_message():
print(f"Processing chat for user_id: {user_id}")

# Add this to leann_chat_api.py in __init__():
print(f"Initialized LeannChatAPI for user: {self.user_id}")
```

## Troubleshooting

### Issue: "Module leann not found"

**Solution:** Install the leann package
```bash
pip install -e .
# or
pip install leann
```

### Issue: "Connection refused on port 3001"

**Solution:** Backend is not running
```bash
./start_backend.sh
```

### Issue: "401 Unauthorized" in chat

**Solution:** Token expired or invalid
- Logout and login again
- Check backend is running
- Verify JWT_SECRET_KEY matches

### Issue: "Database connection error"

**Solution:** PostgreSQL not running or wrong credentials
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Create the database
./create_userdb.sh

# Verify connection string in leann_chat_api.py
database_connect="postgresql://useradmin:userdb1234@localhost/userdb"
```

## Security Notes

### Current Implementation (Development)

- Users stored in-memory (lost on restart)
- Simple JWT with configurable secret
- CORS enabled for localhost

### Production Recommendations

1. **Database**: Use PostgreSQL/MongoDB for user storage
2. **Secrets**: Use environment variables for all secrets
3. **HTTPS**: Enable SSL/TLS
4. **Rate Limiting**: Prevent abuse
5. **Token Refresh**: Implement automatic token refresh
6. **Password Policy**: Enforce strong passwords
7. **Email Verification**: Verify email addresses
8. **Session Management**: Add session timeout and revocation

## Summary

The integration works as follows:

1. **User logs in** → Backend creates JWT with user_id
2. **JWT stored** in localStorage on frontend
3. **Every chat request** includes JWT in Authorization header
4. **Backend validates JWT** and extracts user_id
5. **LeannChatAPI initialized** with that user_id
6. **Memori uses user_id** for isolated memory/storage
7. **Response sent back** to UI with sources
8. **UI displays** the chat message with sources

Each user has complete isolation:
- Unique user_id (UUID)
- Separate Memori instance
- Individual chat history
- Personal memory storage
- Isolated session data

This ensures privacy and personalized experience for each user!
