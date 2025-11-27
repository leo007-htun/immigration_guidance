"""
FastAPI Backend for LEANN Chat Application
Handles authentication and chat endpoints
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
import jwt
from datetime import datetime, timedelta, timezone
import uuid
import bcrypt
import os
from pathlib import Path
import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(dotenv_path=env_path)

# Import LeannChat functionality
import sys
src_path = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(src_path))

from scripts.leann_chat_api import LeannChatAPI

app = FastAPI(title="LEANN API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours for longer admin sessions
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Database Configuration
DB_CONFIG = {
    "host": "localhost",
    "database": "userdb",
    "user": "useradmin",
    "password": "userdb1234"
}

# Database connection context manager
@contextmanager
def get_db_connection():
    """Context manager for database connections"""
    conn = psycopg2.connect(**DB_CONFIG)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# Models
class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    displayName: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None


class User(BaseModel):
    id: str
    email: str
    displayName: Optional[str] = None
    isEmailVerified: bool = False
    isAdmin: bool = False


class AuthResponse(BaseModel):
    message: str
    user: User
    accessToken: str
    refreshToken: str


class SourceDocument(BaseModel):
    document_id: int
    text_preview: str
    metadata: str
    relevance_score: float


class ChatResponse(BaseModel):
    response: str
    sources: List[SourceDocument]
    conversation_id: Optional[str] = None


# Utility functions
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Bcrypt has a max password length of 72 bytes
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a bcrypt hash"""
    # Truncate password to match what was hashed
    password_bytes = plain_password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return user info from database"""
    try:
        token = credentials.credentials
        payload = decode_token(token)

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")

        # Fetch user from database
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    "SELECT id, email, is_active, is_email_verified, is_admin FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user['is_active']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )

        return dict(user)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_current_user: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication error: {str(e)}"
        )


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Verify user is admin"""
    if not current_user.get('is_admin', False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def create_chat_instance(user_id: str, user_email: str = None) -> LeannChatAPI:
    """
    Create a fresh LeannChatAPI instance for each request.

    This ensures LeannChat doesn't accumulate conversation history across requests.
    Memori handles conversation history storage with proper user isolation.
    """
    return LeannChatAPI(user_id, user_email=user_email)


# Routes
@app.get("/")
async def root():
    return {"message": "LEANN API Server", "status": "running"}


@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Register a new user in database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Check if user already exists
                cur.execute("SELECT id FROM users WHERE email = %s", (request.email,))
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Email already registered"
                    )

                # Create new user
                user_id = str(uuid.uuid4())
                hashed_password = hash_password(request.password)

                cur.execute("""
                    INSERT INTO users (id, email, password_hash, is_active, is_email_verified, is_admin)
                    VALUES (%s::uuid, %s, %s, %s, %s, %s)
                    RETURNING id, email, is_email_verified, is_admin
                """, (user_id, request.email, hashed_password, True, False, False))

                user_data = cur.fetchone()
                user_id_str = str(user_data['id'])

                print(f"Signup: Created user with ID: {user_id_str}")

        # Generate tokens
        access_token = create_access_token({"sub": user_id_str, "email": request.email})
        refresh_token = create_refresh_token({"sub": user_id_str})

        # Store refresh token in database (hashed for security)
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                token_hash = hash_password(refresh_token)  # Reuse hash function
                cur.execute("""
                    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                    VALUES (%s::uuid, %s, %s)
                """, (user_id, token_hash, datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)))

        user = User(
            id=user_id_str,
            email=request.email,
            displayName=request.displayName,
            isEmailVerified=False,
            isAdmin=user_data.get('is_admin', False)
        )

        return AuthResponse(
            message="User registered successfully",
            user=user,
            accessToken=access_token,
            refreshToken=refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Signup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login user from database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Find user by email
                cur.execute("""
                    SELECT id, email, password_hash, is_active, is_email_verified, is_admin
                    FROM users WHERE email = %s
                """, (request.email,))
                user_data = cur.fetchone()

        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not verify_password(request.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user_data["is_active"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account is inactive"
            )

        user_id_str = str(user_data["id"])

        # Update last login time
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE users SET last_login_at = %s WHERE id = %s",
                    (datetime.now(timezone.utc), user_data["id"])
                )

        # Generate tokens
        access_token = create_access_token({"sub": user_id_str, "email": request.email})
        refresh_token = create_refresh_token({"sub": user_id_str})

        # Store refresh token in database (hashed for security)
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                token_hash = hash_password(refresh_token)  # Reuse hash function
                cur.execute("""
                    INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
                    VALUES (%s, %s, %s)
                """, (user_data["id"], token_hash, datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)))

        user = User(
            id=user_id_str,
            email=user_data["email"],
            displayName=None,
            isEmailVerified=user_data["is_email_verified"],
            isAdmin=user_data.get("is_admin", False)
        )

        return AuthResponse(
            message="Login successful",
            user=user,
            accessToken=access_token,
            refreshToken=refresh_token
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@app.post("/api/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token"""
    token = request.refreshToken

    if token not in refresh_tokens_db:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

    payload = decode_token(token)

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )

    user_id = payload.get("sub")
    user_data = users_db.get(user_id)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    # Generate new access token
    access_token = create_access_token({"sub": user_id, "email": user_data["email"]})

    return {"accessToken": access_token}


@app.post("/api/auth/logout")
async def logout(request: RefreshTokenRequest):
    """Logout user"""
    token = request.refreshToken
    if token in refresh_tokens_db:
        del refresh_tokens_db[token]

    return {"message": "Logged out successfully"}


@app.get("/api/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    user = User(
        id=current_user["id"],
        email=current_user["email"],
        displayName=current_user.get("displayName"),
        isEmailVerified=current_user.get("is_email_verified", False),
        isAdmin=current_user.get("is_admin", False)
    )
    return {"user": user}


@app.post("/api/chat/message", response_model=ChatResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send a chat message and get response from LEANN"""
    try:
        user_id = current_user["id"]
        user_email = current_user.get("email")
        print(f"Chat: Processing message for user: {user_id} ({user_email})")
        print(f"Chat: Message: {request.message[:50]}...")

        # Create fresh chat instance for this request
        # This prevents LeannChat from accumulating cross-request conversation history
        chat_api = create_chat_instance(user_id, user_email=user_email)

        # Get response from LEANN
        response = chat_api.ask(request.message, top_k=3)

        # Format sources
        sources = []
        if hasattr(response, 'sources') and response.sources:
            for idx, source in enumerate(response.sources):
                sources.append(SourceDocument(
                    document_id=idx,
                    text_preview=source.get('text', '')[:200],
                    metadata=str(source.get('metadata', {})),
                    relevance_score=source.get('score', 0.0)
                ))

        return ChatResponse(
            response=response.get('answer', str(response)) if isinstance(response, dict) else str(response),
            sources=sources,
            conversation_id=request.conversation_id
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@app.get("/api/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    """Get chat history for current user"""
    # TODO: Implement chat history retrieval from database
    return {"conversations": []}


@app.delete("/api/chat/conversation/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a conversation"""
    # TODO: Implement conversation deletion
    return {"message": "Conversation deleted"}


# Admin Routes
@app.get("/api/admin/stats")
async def get_admin_stats(admin_user: dict = Depends(get_admin_user)):
    """Get system statistics (admin only)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # User stats
                cur.execute("""
                    SELECT
                        COUNT(*) as total_users,
                        COUNT(*) FILTER (WHERE is_active = true) as active_users,
                        COUNT(*) FILTER (WHERE is_email_verified = true) as verified_users,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_month
                    FROM users
                """)
                user_stats = cur.fetchone()

                # Chat stats
                cur.execute("""
                    SELECT
                        COUNT(*) as total_conversations,
                        COUNT(DISTINCT user_id) as users_with_chats,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as chats_today,
                        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as chats_week,
                        COALESCE(SUM(tokens_used), 0) as total_tokens
                    FROM chat_history
                """)
                chat_stats = cur.fetchone()

                # Memory stats
                cur.execute("""
                    SELECT
                        COUNT(*) as total_stm,
                        COUNT(DISTINCT user_id) as users_with_stm,
                        AVG(importance_score) as avg_importance
                    FROM short_term_memory
                """)
                stm_stats = cur.fetchone()

                cur.execute("""
                    SELECT
                        COUNT(*) as total_ltm,
                        COUNT(DISTINCT user_id) as users_with_ltm,
                        AVG(importance_score) as avg_importance,
                        COUNT(*) FILTER (WHERE is_user_context = true) as user_context_count,
                        COUNT(*) FILTER (WHERE is_preference = true) as preferences_count
                    FROM long_term_memory
                """)
                ltm_stats = cur.fetchone()

                # Top users by activity
                cur.execute("""
                    SELECT
                        u.email,
                        COUNT(ch.chat_id) as chat_count,
                        COALESCE(SUM(ch.tokens_used), 0) as tokens_used,
                        MAX(ch.created_at) as last_activity
                    FROM users u
                    LEFT JOIN chat_history ch ON u.id = ch.user_id
                    GROUP BY u.id, u.email
                    ORDER BY chat_count DESC
                    LIMIT 10
                """)
                top_users = cur.fetchall()

                # Memory distribution by category
                cur.execute("""
                    SELECT
                        category_primary,
                        COUNT(*) as count
                    FROM long_term_memory
                    GROUP BY category_primary
                    ORDER BY count DESC
                    LIMIT 10
                """)
                memory_categories = cur.fetchall()

        return {
            "user_stats": dict(user_stats),
            "chat_stats": dict(chat_stats),
            "memory_stats": {
                "short_term": dict(stm_stats),
                "long_term": dict(ltm_stats)
            },
            "top_users": [dict(u) for u in top_users],
            "memory_categories": [dict(c) for c in memory_categories]
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve stats: {str(e)}"
        )


@app.get("/api/admin/users")
async def get_all_users(admin_user: dict = Depends(get_admin_user)):
    """Get all users (admin only)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    SELECT
                        u.id,
                        u.email,
                        u.is_active,
                        u.is_email_verified,
                        u.is_admin,
                        u.created_at,
                        u.last_login_at,
                        COUNT(DISTINCT ch.chat_id) as chat_count,
                        COUNT(DISTINCT ltm.memory_id) as ltm_count,
                        COUNT(DISTINCT stm.memory_id) as stm_count
                    FROM users u
                    LEFT JOIN chat_history ch ON u.id = ch.user_id
                    LEFT JOIN long_term_memory ltm ON u.id = ltm.user_id
                    LEFT JOIN short_term_memory stm ON u.id = stm.user_id
                    GROUP BY u.id, u.email, u.is_active, u.is_email_verified, u.is_admin, u.created_at, u.last_login_at
                    ORDER BY u.created_at DESC
                """)
                users = cur.fetchall()

        return {"users": [dict(u) for u in users]}

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve users: {str(e)}"
        )


@app.get("/api/admin/user/{user_id}/details")
async def get_user_details(user_id: str, admin_user: dict = Depends(get_admin_user)):
    """Get detailed user information (admin only)"""
    try:
        with get_db_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # User info
                cur.execute("""
                    SELECT id, email, is_active, is_email_verified, is_admin, created_at, last_login_at
                    FROM users WHERE id = %s
                """, (user_id,))
                user = cur.fetchone()

                if not user:
                    raise HTTPException(status_code=404, detail="User not found")

                # Recent chats
                cur.execute("""
                    SELECT chat_id, LEFT(user_input, 100) as user_input_preview,
                           LEFT(ai_output, 100) as ai_output_preview,
                           tokens_used, created_at
                    FROM chat_history
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 20
                """, (user_id,))
                recent_chats = cur.fetchall()

                # Memory counts
                cur.execute("""
                    SELECT
                        COUNT(*) as ltm_count,
                        AVG(importance_score) as avg_importance
                    FROM long_term_memory
                    WHERE user_id = %s
                """, (user_id,))
                ltm_info = cur.fetchone()

                cur.execute("""
                    SELECT
                        COUNT(*) as stm_count,
                        AVG(importance_score) as avg_importance
                    FROM short_term_memory
                    WHERE user_id = %s
                """, (user_id,))
                stm_info = cur.fetchone()

        return {
            "user": dict(user),
            "recent_chats": [dict(c) for c in recent_chats],
            "memory_info": {
                "long_term": dict(ltm_info),
                "short_term": dict(stm_info)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user details: {str(e)}"
        )


# Document Management Routes
from fastapi import UploadFile, File as FastAPIFile
import shutil
import subprocess

DOCUMENTS_DIR = Path(__file__).resolve().parents[1] / "data"
LEANN_CONVERTER_PATH = Path(__file__).resolve().parents[1] / "src" / "utils" / "leann_converter.py"

@app.get("/api/documents/list")
async def list_documents(admin_user: dict = Depends(get_admin_user)):
    """List all documents in /data directory (admin only)"""
    try:
        if not DOCUMENTS_DIR.exists():
            DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

        documents = []
        for file_path in DOCUMENTS_DIR.glob("*.pdf"):
            stat = file_path.stat()
            documents.append({
                "filename": file_path.name,
                "file_path": str(file_path),
                "size_bytes": stat.st_size,
                "uploaded_at": datetime.fromtimestamp(stat.st_mtime).isoformat()
            })

        # Sort by upload time, newest first
        documents.sort(key=lambda x: x["uploaded_at"], reverse=True)
        return documents

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = FastAPIFile(...),
    admin_user: dict = Depends(get_admin_user)
):
    """Upload a PDF document to /data directory (admin only)"""
    try:
        if not file.filename.endswith('.pdf'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files are allowed"
            )

        if not DOCUMENTS_DIR.exists():
            DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

        file_path = DOCUMENTS_DIR / file.filename

        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "success": True,
            "filename": file.filename,
            "file_path": str(file_path),
            "message": f"Document '{file.filename}' uploaded successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@app.delete("/api/documents/delete/{filename}")
async def delete_document(
    filename: str,
    admin_user: dict = Depends(get_admin_user)
):
    """Delete a document from /data directory (admin only)"""
    try:
        file_path = DOCUMENTS_DIR / filename

        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document '{filename}' not found"
            )

        if not file_path.is_file() or not str(file_path).startswith(str(DOCUMENTS_DIR)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )

        file_path.unlink()

        return {
            "success": True,
            "message": f"Document '{filename}' deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )


@app.post("/api/documents/rebuild-index")
async def rebuild_index(admin_user: dict = Depends(get_admin_user)):
    """Rebuild LEANN index using leann_converter.py (admin only)"""
    try:
        if not LEANN_CONVERTER_PATH.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="leann_converter.py not found at /utils/leann_converter.py"
            )

        # Count PDF files
        pdf_files = list(DOCUMENTS_DIR.glob("*.pdf"))
        pdf_count = len(pdf_files)

        if pdf_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No PDF documents found in /data directory"
            )

        # Run leann_converter.py
        result = subprocess.run(
            ["python3", str(LEANN_CONVERTER_PATH)],
            cwd=str(DOCUMENTS_DIR.parent),
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )

        if result.returncode != 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Index rebuild failed: {result.stderr}"
            )

        return {
            "success": True,
            "message": f"Index rebuilt successfully with {pdf_count} documents",
            "documents_indexed": pdf_count,
            "output": result.stdout
        }

    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Index rebuild timed out after 5 minutes"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to rebuild index: {str(e)}"
        )


# ============================================================================
# OpenAI Usage and Cost Tracking Endpoints (Admin Only)
# ============================================================================

def fetch_all_pages(url, headers, params=None):
    """Fetch all pages from a paginated OpenAI API endpoint."""
    all_data = []
    next_page = None
    while True:
        req_params = dict(params or {})
        if next_page:
            req_params["page"] = next_page
        resp = requests.get(url, headers=headers, params=req_params)
        resp.raise_for_status()
        data = resp.json()
        all_data.extend(data.get("data", []))
        if not data.get("has_more"):
            break
        next_page = data.get("next_page")
    return all_data


def aggregate_usage(usage_data):
    """Aggregate token usage from OpenAI API response."""
    total_input = 0
    total_output = 0
    for bucket in usage_data:
        for result in bucket.get("results", []):
            total_input += result.get("input_tokens", 0)
            total_output += result.get("output_tokens", 0)
    return total_input, total_output


def aggregate_costs(cost_data):
    """Aggregate costs from OpenAI API response."""
    total_cost = 0.0
    for bucket in cost_data:
        for result in bucket.get("results", []):
            amount = result.get("amount", {}).get("value", 0.0)
            total_cost += amount
    return total_cost


class UsageCostResponse(BaseModel):
    """Response model for usage and cost data"""
    total_input_tokens: int
    total_output_tokens: int
    total_tokens: int
    total_cost_usd: float
    period_days: int
    start_date: str
    end_date: str


@app.get("/api/admin/usage-cost", response_model=UsageCostResponse)
async def get_usage_cost(
    days: int = 7,
    admin_user: dict = Depends(get_admin_user)
):
    """
    Get OpenAI API usage and cost data for the specified period (admin only)

    Args:
        days: Number of days to look back (default: 7)
    """
    try:
        # Get API key from environment
        api_key = os.getenv("ADMIN_KEY")
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="ADMIN_KEY not configured in environment"
            )

        org_id = os.getenv("ORG_ID")

        # Setup headers
        headers = {
            "Authorization": f"Bearer {api_key}"
        }
        if org_id:
            headers["OpenAI-Organization"] = org_id

        # Calculate time range
        end = datetime.utcnow()
        start = end - timedelta(days=days)

        base_url = "https://api.openai.com/v1"
        usage_url = f"{base_url}/organization/usage/completions"
        costs_url = f"{base_url}/organization/costs"

        params = {
            "start_time": int(start.timestamp()),
            "end_time": int(end.timestamp()),
            "interval": "1d"
        }

        # Fetch usage data
        total_input_tokens = 0
        total_output_tokens = 0
        try:
            print(f"Fetching usage data from: {usage_url}")
            usage_data = fetch_all_pages(usage_url, headers, params)
            total_input_tokens, total_output_tokens = aggregate_usage(usage_data)
            print(f"Successfully fetched usage data: {total_input_tokens} input, {total_output_tokens} output")
        except Exception as e:
            print(f"Error fetching usage data: {e}")
            import traceback
            traceback.print_exc()

        # Fetch cost data
        total_cost_usd = 0.0
        try:
            print(f"Fetching cost data from: {costs_url}")
            costs_data = fetch_all_pages(costs_url, headers, params)
            total_cost_usd = aggregate_costs(costs_data)
            print(f"Successfully fetched cost data: ${total_cost_usd}")
        except Exception as e:
            print(f"Error fetching costs data: {e}")
            import traceback
            traceback.print_exc()

        return UsageCostResponse(
            total_input_tokens=total_input_tokens,
            total_output_tokens=total_output_tokens,
            total_tokens=total_input_tokens + total_output_tokens,
            total_cost_usd=total_cost_usd,
            period_days=days,
            start_date=start.strftime("%Y-%m-%d"),
            end_date=end.strftime("%Y-%m-%d")
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in get_usage_cost: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch usage/cost data: {str(e)}"
        )


# ============================================================================
# Health Check Endpoint
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint for Docker and load balancers"""
    return {"status": "healthy", "service": "leann-backend"}


if __name__ == "__main__":
    import uvicorn
    # Use port 3001 for auth endpoints and 8000 for chat
    # We'll run this on 3001 and proxy to 8000
    uvicorn.run(app, host="0.0.0.0", port=3001)
