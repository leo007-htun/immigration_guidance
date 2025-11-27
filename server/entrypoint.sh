#!/bin/bash
set -e

echo "Starting LEANN Backend..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until PGPASSWORD=$DATABASE_PASSWORD psql -h "$DATABASE_HOST" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c '\q' 2>/dev/null; do
  >&2 echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

>&2 echo "PostgreSQL is up - continuing"

# Initialize database tables if they don't exist
echo "Initializing database tables..."
bash /app/db/create_userdb.sh || true

# Check if admin user exists, if not create it
echo "Checking admin user..."
python3 <<EOF
import psycopg2
import bcrypt
import os

conn = psycopg2.connect(
    host=os.getenv('DATABASE_HOST', 'localhost'),
    database=os.getenv('DATABASE_NAME', 'userdb'),
    user=os.getenv('DATABASE_USER', 'useradmin'),
    password=os.getenv('DATABASE_PASSWORD', 'userdb1234')
)
cur = conn.cursor()

# Check if admin user exists
cur.execute("SELECT id FROM users WHERE email = 'admin@hotmail.com'")
if cur.fetchone() is None:
    print("Creating admin user...")
    password = 'admin'
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    cur.execute(
        "INSERT INTO users (email, password_hash, is_active, is_email_verified, is_admin) VALUES (%s, %s, %s, %s, %s)",
        ('admin@hotmail.com', password_hash, True, True, True)
    )
    conn.commit()
    print("Admin user created successfully!")
else:
    print("Admin user already exists")

cur.close()
conn.close()
EOF

echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 3001
