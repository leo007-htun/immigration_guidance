#!/bin/bash
# Quick run script for backend (no venv setup, just run)

cd "$(dirname "$0")"

echo "🚀 Starting LEANN Backend Server..."
echo "====================================="
echo ""
echo "Backend will run on: http://localhost:3001"
echo "API docs available at: http://localhost:3001/docs"
echo ""
echo "Press CTRL+C to stop"
echo ""

python3 server/main.py
