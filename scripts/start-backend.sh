#!/bin/bash
# Start the PHP backend server

echo "Starting KANGO PHP Backend Server..."
echo "=================================="
echo "Server will run at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

# Navigate to backend directory (relative to project root)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT/backend"
php -S localhost:8000 index.php
