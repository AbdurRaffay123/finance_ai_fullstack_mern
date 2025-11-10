#!/bin/bash
# Script to restart the backend server

echo "Stopping existing server on port 5000..."
lsof -ti:5000 | xargs kill -9 2>/dev/null || echo "No server found on port 5000"

sleep 2

echo "Starting server..."
node server.js







