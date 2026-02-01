#!/bin/bash
# Start the PHP backend server

echo "Starting KANGO PHP Backend Server..."
echo "=================================="
echo "Server will run at: http://localhost:8001"
echo "Press Ctrl+C to stop the server"
echo ""

cd "$(dirname "$0")/backend"
php -S localhost:8001 index.php
