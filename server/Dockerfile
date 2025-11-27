FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install leann dependencies (CPU-only PyTorch)
# This ensures torch is CPU-only and smaller
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir leann torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install other Python packages
COPY server/requirements.txt /app/server/requirements.txt
RUN pip install --no-cache-dir -r /app/server/requirements.txt

# Copy application code
COPY server/ /app/server/
COPY src/ /app/src/
COPY data/ /app/data/

# Create data directory if it doesn't exist
RUN mkdir -p /app/data

WORKDIR /app/server

# Make entrypoint executable
RUN chmod +x /app/server/entrypoint.sh

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Run the application
ENTRYPOINT ["/app/server/entrypoint.sh"]
