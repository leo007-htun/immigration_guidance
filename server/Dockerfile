FROM python:3.10-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements (excluding leann / torch)
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

# Copy application code
COPY server/ /app/server/
COPY src/ /app/src/
COPY data/ /app/data/

# Make entrypoint executable
RUN chmod +x /app/server/entrypoint.sh

WORKDIR /app/server

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/app/server/entrypoint.sh"]
