#!/bin/bash

# Find and kill the process running on port 5000
echo "Stopping server on port 5000..."
PID=$(lsof -ti:5000)
if [ ! -z "$PID" ]; then
    kill $PID
    sleep 2
    echo "Server stopped."
else
    echo "No server running on port 5000."
fi

# Start the server
echo "Starting server..."
cd "$(dirname "$0")"
node server.js
