FROM python:3.10-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Install CPU-only PyTorch first (to avoid CUDA bloat)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install leann (will use the already-installed CPU torch)
RUN pip install --no-cache-dir --no-deps leann && \
    pip install --no-cache-dir numpy scipy scikit-learn tqdm

# Copy requirements and install other Python packages
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

# Copy application code
COPY server/ /app/server/
COPY src/ /app/src/
COPY data/ /app/data/
COPY db/ /app/db/

# Create data directory if it doesn't exist
RUN mkdir -p /app/data

# Make db init script executable
RUN chmod +x /app/db/create_userdb.sh

WORKDIR /app/server

# Make entrypoint executable
RUN chmod +x /app/server/entrypoint.sh

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Run the application
ENTRYPOINT ["/app/server/entrypoint.sh"]
