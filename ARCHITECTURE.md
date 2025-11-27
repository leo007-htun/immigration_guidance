# LEANN Chat - System Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                            FRONTEND LAYER                               │
│                        (React + TypeScript)                             │
│                                                                         │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐          │
│  │  LoginPage.tsx │  │ SignupPage.tsx │  │ChatInterface.tsx│          │
│  │                │  │                │  │                 │          │
│  │  - Email input │  │  - Email input │  │ - Message list  │          │
│  │  - Password    │  │  - Password    │  │ - Input field   │          │
│  │  - Submit      │  │  - Submit      │  │ - Send button   │          │
│  └────────┬───────┘  └────────┬───────┘  └────────┬────────┘          │
│           │                   │                    │                   │
│           └───────────────────┴────────────────────┘                   │
│                              │                                         │
│                              ▼                                         │
│           ┌─────────────────────────────────────┐                      │
│           │      API Service Clients            │                      │
│           │  ┌──────────────┐ ┌──────────────┐ │                      │
│           │  │   api.ts     │ │  chatApi.ts  │ │                      │
│           │  │  (Auth API)  │ │  (Chat API)  │ │                      │
│           │  └──────────────┘ └──────────────┘ │                      │
│           └─────────────────────────────────────┘                      │
│                              │                                         │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                    HTTP + JWT Token
                               │
┌──────────────────────────────▼─────────────────────────────────────────┐
│                                                                         │
│                           BACKEND LAYER                                 │
│                       (FastAPI + Python)                                │
│                         server/main.py                                  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                  Authentication Middleware                     │    │
│  │                                                                │    │
│  │  1. Extract JWT from Authorization header                     │    │
│  │  2. Decode JWT token                                          │    │
│  │  3. Verify signature and expiration                           │    │
│  │  4. Extract user_id from "sub" claim                          │    │
│  │  5. Inject user info into request                             │    │
│  └─────────────────────────────┬─────────────────────────────────┘    │
│                                │                                       │
│  ┌─────────────────────────────┴───────────────────────────────────┐  │
│  │                        API Endpoints                            │  │
│  │                                                                 │  │
│  │  Auth Endpoints:                 Chat Endpoints:                │  │
│  │  ┌─────────────────────┐         ┌──────────────────────────┐  │  │
│  │  │ POST /auth/signup   │         │ POST /chat/message       │  │  │
│  │  │ POST /auth/login    │         │ ← Requires JWT           │  │  │
│  │  │ POST /auth/refresh  │         │ ← Extracts user_id       │  │  │
│  │  │ GET  /auth/me       │         │                          │  │  │
│  │  └─────────────────────┘         └──────────┬───────────────┘  │  │
│  │                                              │                  │  │
│  └──────────────────────────────────────────────┼──────────────────┘  │
│                                                 │                     │
│  ┌──────────────────────────────────────────────▼──────────────────┐  │
│  │          User Chat Instance Manager                            │  │
│  │                                                                 │  │
│  │  user_chat_instances = {                                       │  │
│  │    "user-id-1": LeannChatAPI("user-id-1"),                     │  │
│  │    "user-id-2": LeannChatAPI("user-id-2"),                     │  │
│  │    ...                                                          │  │
│  │  }                                                              │  │
│  │                                                                 │  │
│  │  def get_or_create_chat_instance(user_id):                     │  │
│  │      if user_id not in user_chat_instances:                    │  │
│  │          user_chat_instances[user_id] = LeannChatAPI(user_id)  │  │
│  │      return user_chat_instances[user_id]                       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │ user_id
                                 │
┌────────────────────────────────▼───────────────────────────────────────┐
│                                                                         │
│                         LEANN CHAT API LAYER                            │
│                    src/scripts/leann_chat_api.py                        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  class LeannChatAPI:                                            │  │
│  │                                                                 │  │
│  │      def __init__(self, user_id: str):  ← DYNAMIC user_id      │  │
│  │          self.user_id = user_id                                 │  │
│  │          self.session_id = generate_id()                        │  │
│  │                                                                 │  │
│  │          # Initialize user-specific memory                      │  │
│  │          self.memory = Memori(                                  │  │
│  │              user_id=user_id,  ← USER-SPECIFIC                  │  │
│  │              session_id=self.session_id,                        │  │
│  │              database_connect="postgresql://..."               │  │
│  │          )                                                      │  │
│  │                                                                 │  │
│  │          # Initialize LeannChat                                 │  │
│  │          self.chat = LeannChat(INDEX_PATH, ...)                 │  │
│  │                                                                 │  │
│  │      def ask(self, query: str):                                 │  │
│  │          return self.chat.ask(query, top_k=3)                   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                │                                       │
└────────────────────────────────┼───────────────────────────────────────┘
                                 │
                   ┌─────────────┴──────────────┐
                   │                            │
                   ▼                            ▼
      ┌────────────────────────┐    ┌──────────────────────┐
      │   Memori (Memory SDK)  │    │   LeannChat (RAG)    │
      │                        │    │                      │
      │  - user_id: "abc-123"  │    │  - Document index    │
      │  - STM (session)       │    │  - Embeddings        │
      │  - LTM (user)          │    │  - Retrieval         │
      │  - PostgreSQL DB       │    │  - OpenAI LLM        │
      └────────────┬───────────┘    └──────────┬───────────┘
                   │                           │
                   ▼                           ▼
      ┌────────────────────────┐    ┌──────────────────────┐
      │  PostgreSQL Database   │    │   OpenAI API         │
      │                        │    │                      │
      │  Tables per user_id:   │    │  - GPT-4.1-mini      │
      │  - conversations       │    │  - Embeddings        │
      │  - memories            │    │  - Completions       │
      │  - sessions            │    │                      │
      └────────────────────────┘    └──────────────────────┘
```

## Data Flow: User Sends Message "What are H1-B visa requirements?"

```
Step 1: Frontend (ChatInterface.tsx)
┌──────────────────────────────────────────────┐
│ User types message and clicks Send          │
│ ↓                                            │
│ handleSend() is called                       │
│ ↓                                            │
│ chatApi.sendMessage("What are H1-B...")     │
└──────────────────┬───────────────────────────┘
                   │
                   │ POST /api/chat/message
                   │ Headers: Authorization: Bearer eyJhbGc...
                   │ Body: { "message": "What are H1-B..." }
                   │
                   ▼
Step 2: Backend Authentication (server/main.py)
┌──────────────────────────────────────────────┐
│ FastAPI receives request                     │
│ ↓                                            │
│ Security middleware extracts JWT             │
│ ↓                                            │
│ decode_token(token)                          │
│ ↓                                            │
│ payload = {                                  │
│   "sub": "abc-123-def",  ← user_id           │
│   "email": "user@example.com",               │
│   "exp": 1234567890                          │
│ }                                            │
│ ↓                                            │
│ get_current_user() returns user object       │
└──────────────────┬───────────────────────────┘
                   │
                   │ user_id = "abc-123-def"
                   │
                   ▼
Step 3: Chat Endpoint (server/main.py)
┌──────────────────────────────────────────────┐
│ @app.post("/api/chat/message")               │
│ async def send_chat_message(                 │
│     request: ChatMessageRequest,             │
│     current_user: dict = Depends(...)        │
│ ):                                           │
│     user_id = current_user["id"]             │
│     # user_id = "abc-123-def"                │
│     ↓                                        │
│     chat_api = get_or_create_chat_instance(  │
│         user_id="abc-123-def"                │
│     )                                        │
└──────────────────┬───────────────────────────┘
                   │
                   │ Calls LeannChatAPI with user_id
                   │
                   ▼
Step 4: LeannChatAPI Initialization (leann_chat_api.py)
┌──────────────────────────────────────────────┐
│ LeannChatAPI("abc-123-def")                  │
│ ↓                                            │
│ self.user_id = "abc-123-def"                 │
│ self.session_id = "session_xyz789"           │
│ ↓                                            │
│ self.memory = Memori(                        │
│     user_id="abc-123-def",  ← ISOLATED       │
│     session_id="session_xyz789",             │
│     database_connect="postgresql://..."      │
│ )                                            │
│ ↓                                            │
│ self.chat = LeannChat(INDEX_PATH, ...)       │
└──────────────────┬───────────────────────────┘
                   │
                   │ ask("What are H1-B...")
                   │
                   ▼
Step 5: Query Processing (LeannChat)
┌──────────────────────────────────────────────┐
│ LeannChat.ask("What are H1-B...")            │
│ ↓                                            │
│ 1. Generate embedding for query              │
│ 2. Search document index                     │
│ 3. Retrieve top 3 relevant documents         │
│ 4. Build context with documents              │
│ 5. Call OpenAI with context                  │
│ ↓                                            │
│ OpenAI responds with answer                  │
└──────────────────┬───────────────────────────┘
                   │
                   │ Response + Sources
                   │
                   ▼
Step 6: Response Formatting (server/main.py)
┌──────────────────────────────────────────────┐
│ Format response:                             │
│ {                                            │
│   "response": "H1-B visas require...",       │
│   "sources": [                               │
│     {                                        │
│       "document_id": 1,                      │
│       "text_preview": "...",                 │
│       "relevance_score": 0.92                │
│     }                                        │
│   ]                                          │
│ }                                            │
└──────────────────┬───────────────────────────┘
                   │
                   │ JSON Response
                   │
                   ▼
Step 7: UI Update (ChatInterface.tsx)
┌──────────────────────────────────────────────┐
│ Receive response from backend                │
│ ↓                                            │
│ Create new message object:                   │
│ {                                            │
│   id: "msg-456",                             │
│   text: "H1-B visas require...",             │
│   sender: "bot",                             │
│   sources: [...]                             │
│ }                                            │
│ ↓                                            │
│ setMessages([...messages, newMessage])       │
│ ↓                                            │
│ UI re-renders with new message               │
└──────────────────────────────────────────────┘
```

## User Isolation Architecture

```
Multiple Users Simultaneously:

User A (user_id: "aaa-111")           User B (user_id: "bbb-222")
        │                                      │
        │ Logs in                              │ Logs in
        ├─ JWT: {sub: "aaa-111"}               ├─ JWT: {sub: "bbb-222"}
        │                                      │
        │ Sends message                        │ Sends message
        ▼                                      ▼
┌───────────────────┐                  ┌───────────────────┐
│ Backend extracts  │                  │ Backend extracts  │
│ user_id="aaa-111" │                  │ user_id="bbb-222" │
└─────────┬─────────┘                  └─────────┬─────────┘
          │                                      │
          ▼                                      ▼
┌────────────────────┐                ┌────────────────────┐
│ LeannChatAPI       │                │ LeannChatAPI       │
│ user_id="aaa-111"  │                │ user_id="bbb-222"  │
│                    │                │                    │
│ - Separate memory  │                │ - Separate memory  │
│ - Own session      │                │ - Own session      │
│ - Own history      │                │ - Own history      │
└────────┬───────────┘                └────────┬───────────┘
         │                                     │
         ▼                                     ▼
┌──────────────────────┐           ┌──────────────────────┐
│ PostgreSQL           │           │ PostgreSQL           │
│ Table: conversations │           │ Table: conversations │
│ WHERE user_id=       │           │ WHERE user_id=       │
│   "aaa-111"          │           │   "bbb-222"          │
└──────────────────────┘           └──────────────────────┘

NO DATA OVERLAP - Complete isolation!
```

## Security Flow

```
1. User Registration
   ↓
   Password hashed (bcrypt)
   ↓
   Stored in users_db

2. User Login
   ↓
   Verify hashed password
   ↓
   Generate JWT with user_id in "sub" claim
   ↓
   Return JWT to frontend

3. Frontend stores JWT in localStorage

4. Every request includes JWT in header:
   Authorization: Bearer <token>

5. Backend validates JWT:
   ┌────────────────────────────┐
   │ 1. Verify signature        │
   │ 2. Check expiration        │
   │ 3. Extract user_id         │
   │ 4. Validate user exists    │
   └────────────────────────────┘

6. If valid → Process request with user_id
   If invalid → Return 401 Unauthorized
```

## File System Layout

```
leann/
├── server/
│   └── main.py                    ← FastAPI backend
│
├── src/
│   └── scripts/
│       ├── leann_chat.py          ← Original (now can run standalone)
│       └── leann_chat_api.py      ← NEW: API wrapper with user_id
│
├── web/
│   └── src/
│       ├── components/
│       │   ├── LoginPage.tsx      ← Login UI
│       │   ├── SignupPage.tsx     ← Signup UI
│       │   └── ChatInterface.tsx  ← Chat UI
│       └── services/
│           ├── api.ts             ← Auth API client (port 3001)
│           └── chatApi.ts         ← Chat API client (port 3001)
│
├── data/
│   └── index/                     ← LEANN document index
│
├── db/
│   └── users/
│       ├── abc-123-def/           ← User A's data
│       ├── bbb-222-xyz/           ← User B's data
│       └── ...
│
├── .env                           ← Environment variables
├── requirements.txt               ← Python dependencies
├── start_backend.sh               ← Start FastAPI
├── start_frontend.sh              ← Start React
└── test_integration.py            ← Verify setup
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Lucide Icons

### Backend
- FastAPI
- Python 3.10+
- PyJWT (JSON Web Tokens)
- Passlib (Password hashing)
- Uvicorn (ASGI server)

### AI/ML
- LeannChat (RAG system)
- Memori SDK (Memory management)
- OpenAI GPT-4.1-mini
- Document embeddings

### Database
- PostgreSQL (user data, conversations)
- File system (document index)

## Key Innovation: Dynamic user_id

### Before (Original leann_chat.py)
```python
# HARDCODED
user_id = "2d9b104a-7aa7-40f6-84d6-cb789137c6f4"
```

### After (New leann_chat_api.py)
```python
# DYNAMIC - from authenticated user
class LeannChatAPI:
    def __init__(self, user_id: str):  ← Passed from backend
        self.user_id = user_id
        self.memory = Memori(user_id=user_id)  ← User-specific
```

This enables:
✅ Multi-user support
✅ User isolation
✅ Personalized memory
✅ Secure authentication
✅ Scalable architecture

## Summary

The system successfully integrates:

1. **Authentication** → User logs in, gets JWT with user_id
2. **Authorization** → Every request validated via JWT
3. **User Isolation** → Each user_id gets separate LeannChatAPI instance
4. **Memory Management** → Memori uses user_id for isolation
5. **RAG System** → LeannChat retrieves and generates responses
6. **UI Integration** → Responses displayed with sources

All tied together by the **user_id** flowing from authentication through to leann_chat.py!
