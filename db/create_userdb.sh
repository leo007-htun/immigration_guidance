#!/bin/bash
# =============================================
# Script to create PostgreSQL userdb and tables
# Docker-compatible version
# =============================================

set -e

# Variables — change these to your setup
DB_NAME="${POSTGRES_DB:-userdb}"
DB_USER="${POSTGRES_USER:-useradmin}"
DB_PASSWORD="${POSTGRES_PASSWORD:-userdb1234}"
DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"

# Export password for psql to use
export PGPASSWORD="$DB_PASSWORD"

echo "Waiting for PostgreSQL to be ready..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if running in Docker init context
if [ -n "$POSTGRES_USER" ]; then
    # Running as Docker entrypoint script - database already created
    echo "Running in Docker init context - database already exists"
    DB_NAME="$POSTGRES_DB"
else
    # Create database if not in Docker
    echo "Creating database $DB_NAME..."
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"
fi

# Create tables
echo "Creating tables in $DB_NAME..."
psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" <<'EOSQL'
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false
);

-- Email tokens
CREATE TABLE IF NOT EXISTS email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    profile_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
    chat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_input TEXT NOT NULL,
    ai_output TEXT NOT NULL,
    model VARCHAR(255) NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    tokens_used INTEGER,
    metadata_json JSONB,
    assistant_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_chat_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_history(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_model ON chat_history(model);
CREATE INDEX IF NOT EXISTS idx_chat_user_assistant ON chat_history(user_id, assistant_id);

-- Short-term memory
CREATE TABLE IF NOT EXISTS short_term_memory (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chat_id UUID REFERENCES chat_history(chat_id) ON DELETE SET NULL,
    processed_data JSONB NOT NULL,
    importance_score DOUBLE PRECISION NOT NULL,
    category_primary VARCHAR(255) NOT NULL,
    retention_type VARCHAR(50) NOT NULL,
    assistant_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    searchable_content TEXT NOT NULL,
    summary TEXT NOT NULL,
    is_permanent_context BOOLEAN,
    access_count INTEGER,
    last_accessed TIMESTAMPTZ,
    search_vector TSVECTOR
);
CREATE INDEX IF NOT EXISTS idx_short_term_user_id ON short_term_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_short_term_category ON short_term_memory(category_primary);
CREATE INDEX IF NOT EXISTS idx_short_term_created ON short_term_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_short_term_expires ON short_term_memory(expires_at);
CREATE INDEX IF NOT EXISTS idx_short_term_importance ON short_term_memory(importance_score);
CREATE INDEX IF NOT EXISTS idx_short_term_permanent ON short_term_memory(is_permanent_context);
CREATE INDEX IF NOT EXISTS idx_short_term_search_vector ON short_term_memory USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_short_term_user_assistant ON short_term_memory(user_id, assistant_id);
CREATE INDEX IF NOT EXISTS idx_short_term_user_category ON short_term_memory(user_id, category_primary, importance_score);

-- Long-term memory
CREATE TABLE IF NOT EXISTS long_term_memory (
    memory_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    processed_data JSONB NOT NULL,
    importance_score DOUBLE PRECISION NOT NULL,
    category_primary VARCHAR(255) NOT NULL,
    retention_type VARCHAR(50) NOT NULL,
    assistant_id VARCHAR(255),
    session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    searchable_content TEXT NOT NULL,
    summary TEXT NOT NULL,
    novelty_score DOUBLE PRECISION,
    relevance_score DOUBLE PRECISION,
    actionability_score DOUBLE PRECISION,
    classification VARCHAR(50) NOT NULL,
    memory_importance VARCHAR(20) NOT NULL,
    topic VARCHAR(255),
    entities_json JSONB,
    keywords_json JSONB,
    is_user_context BOOLEAN,
    is_preference BOOLEAN,
    is_skill_knowledge BOOLEAN,
    is_current_project BOOLEAN,
    promotion_eligible BOOLEAN,
    duplicate_of VARCHAR(255),
    supersedes_json JSONB,
    related_memories_json JSONB,
    confidence_score DOUBLE PRECISION,
    classification_reason TEXT,
    processed_for_duplicates BOOLEAN,
    conscious_processed BOOLEAN,
    access_count INTEGER,
    last_accessed TIMESTAMPTZ,
    version INTEGER NOT NULL,
    search_vector TSVECTOR
);
CREATE INDEX IF NOT EXISTS idx_long_term_user_id ON long_term_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_long_term_category ON long_term_memory(category_primary);
CREATE INDEX IF NOT EXISTS idx_long_term_classification ON long_term_memory(classification);
CREATE INDEX IF NOT EXISTS idx_long_term_confidence ON long_term_memory(confidence_score);
CREATE INDEX IF NOT EXISTS idx_long_term_conscious_flags ON long_term_memory(is_user_context, is_preference, is_skill_knowledge, promotion_eligible);
CREATE INDEX IF NOT EXISTS idx_long_term_conscious_processed ON long_term_memory(conscious_processed);
CREATE INDEX IF NOT EXISTS idx_long_term_created ON long_term_memory(created_at);
CREATE INDEX IF NOT EXISTS idx_long_term_duplicates ON long_term_memory(processed_for_duplicates);
CREATE INDEX IF NOT EXISTS idx_long_term_importance ON long_term_memory(importance_score);
CREATE INDEX IF NOT EXISTS idx_long_term_memory_importance ON long_term_memory(memory_importance);
CREATE INDEX IF NOT EXISTS idx_long_term_scores ON long_term_memory(novelty_score, relevance_score, actionability_score);
CREATE INDEX IF NOT EXISTS idx_long_term_search_vector ON long_term_memory USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_long_term_topic ON long_term_memory(topic);
CREATE INDEX IF NOT EXISTS idx_long_term_user_assistant ON long_term_memory(user_id, assistant_id);
CREATE INDEX IF NOT EXISTS idx_long_term_user_category ON long_term_memory(user_id, category_primary, importance_score);
CREATE INDEX IF NOT EXISTS idx_long_term_version ON long_term_memory(memory_id, version);

EOSQL

echo "All tables created successfully in $DB_NAME."
