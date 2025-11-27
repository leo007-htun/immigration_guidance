#!/bin/bash
# Start the LEANN backend server

echo "Starting LEANN Backend Server..."
echo "================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Using system Python..."
    echo "Note: You can create a venv if needed: python3 -m venv venv"
fi

# Use venv if it exists, otherwise use system python
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate

    # Install/update dependencies
    echo "Installing dependencies..."
    pip install -r requirements.txt
else
    echo "Using system Python installation"
    echo "Checking if dependencies are installed..."
    python3 -c "import fastapi, uvicorn, jwt, passlib, memori, leann" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "Some dependencies are missing. Installing..."
        pip3 install --user -r requirements.txt
    fi
fi

# Start the server
echo "Starting FastAPI server on port 3001..."
cd server
python3 main.py
