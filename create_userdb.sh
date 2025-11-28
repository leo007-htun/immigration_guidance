#!/bin/bash
# =============================================
# Script to create PostgreSQL userdb and tables
# =============================================

# Variables — change these to your setup
DB_NAME="userdb"
DB_USER="useradmin"
DB_PASSWORD="userdb1234"
DB_HOST="localhost"
DB_PORT="5432"

# Export password for psql to use
export PGPASSWORD="$DB_PASSWORD"

# Create database
echo "Creating database $DB_NAME..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "CREATE DATABASE $DB_NAME;"

# Create tables
echo "Creating tables in $DB_NAME..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME <<'EOSQL'
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email CITEXT UNIQUE NOT NULL,
    password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ,
    failed_login_count INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,

);

CREATE INDEX idx_users_email ON users(email);


-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT false
);

-- Email tokens
CREATE TABLE email_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT false
);


-- Audit logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_user ON audit_logs(user_id);

-- User profiles (optional additional user data)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name TEXT,
    profile_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Chat history (for conversation memory)
CREATE TABLE chat_history (
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
CREATE INDEX idx_chat_user_id ON chat_history(user_id);
CREATE INDEX idx_chat_created ON chat_history(created_at);
CREATE INDEX idx_chat_session ON chat_history(session_id);
CREATE INDEX idx_chat_model ON chat_history(model);
CREATE INDEX idx_chat_user_assistant ON chat_history(user_id, assistant_id);

-- Short-term memory (temporary conversation context)
CREATE TABLE short_term_memory (
    memory_id TEXT PRIMARY KEY,
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
CREATE INDEX idx_short_term_user_id ON short_term_memory(user_id);
CREATE INDEX idx_short_term_category ON short_term_memory(category_primary);
CREATE INDEX idx_short_term_created ON short_term_memory(created_at);
CREATE INDEX idx_short_term_expires ON short_term_memory(expires_at);
CREATE INDEX idx_short_term_importance ON short_term_memory(importance_score);
CREATE INDEX idx_short_term_permanent ON short_term_memory(is_permanent_context);
CREATE INDEX idx_short_term_search_vector ON short_term_memory USING gin(search_vector);
CREATE INDEX idx_short_term_user_assistant ON short_term_memory(user_id, assistant_id);
CREATE INDEX idx_short_term_user_category ON short_term_memory(user_id, category_primary, importance_score);

-- Long-term memory (persistent important information)
CREATE TABLE long_term_memory (
    memory_id TEXT PRIMARY KEY,
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
CREATE INDEX idx_long_term_user_id ON long_term_memory(user_id);
CREATE INDEX idx_long_term_category ON long_term_memory(category_primary);
CREATE INDEX idx_long_term_classification ON long_term_memory(classification);
CREATE INDEX idx_long_term_confidence ON long_term_memory(confidence_score);
CREATE INDEX idx_long_term_conscious_flags ON long_term_memory(is_user_context, is_preference, is_skill_knowledge, promotion_eligible);
CREATE INDEX idx_long_term_conscious_processed ON long_term_memory(conscious_processed);
CREATE INDEX idx_long_term_created ON long_term_memory(created_at);
CREATE INDEX idx_long_term_duplicates ON long_term_memory(processed_for_duplicates);
CREATE INDEX idx_long_term_importance ON long_term_memory(importance_score);
CREATE INDEX idx_long_term_memory_importance ON long_term_memory(memory_importance);
CREATE INDEX idx_long_term_scores ON long_term_memory(novelty_score, relevance_score, actionability_score);
CREATE INDEX idx_long_term_search_vector ON long_term_memory USING gin(search_vector);
CREATE INDEX idx_long_term_topic ON long_term_memory(topic);
CREATE INDEX idx_long_term_user_assistant ON long_term_memory(user_id, assistant_id);
CREATE INDEX idx_long_term_user_category ON long_term_memory(user_id, category_primary, importance_score);
CREATE INDEX idx_long_term_version ON long_term_memory(memory_id, version);

-- Set ownership
ALTER TABLE public.audit_logs OWNER TO useradmin;
ALTER TABLE public.email_tokens OWNER TO useradmin;
ALTER TABLE public.refresh_tokens OWNER TO useradmin;
ALTER TABLE public.users OWNER TO useradmin;
ALTER TABLE public.user_profiles OWNER TO useradmin;
ALTER TABLE public.chat_history OWNER TO useradmin;
ALTER TABLE public.short_term_memory OWNER TO useradmin;
ALTER TABLE public.long_term_memory OWNER TO useradmin;



EOSQL

echo "All tables created successfully in $DB_NAME."
