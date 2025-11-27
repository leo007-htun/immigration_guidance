#!/bin/bash
# Start the LEANN frontend (React + Vite)

echo "Starting LEANN Frontend..."
echo "========================="

cd web

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
fi

# Start the development server
echo "Starting Vite dev server..."
npm run dev
