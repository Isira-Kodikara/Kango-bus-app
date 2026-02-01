#!/bin/bash
# KANGO Database Setup Script

echo "=========================================="
echo "KANGO Smart Bus Navigation - Database Setup"
echo "=========================================="
echo ""

# Check if MySQL is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL is not installed or not in PATH"
    echo ""
    echo "Install MySQL using Homebrew:"
    echo "  brew install mysql"
    echo "  brew services start mysql"
    echo ""
    exit 1
fi

echo "✅ MySQL found"
echo ""

# Get MySQL credentials
read -p "MySQL username (default: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

read -sp "MySQL password (press Enter if none): " MYSQL_PASS
echo ""

# Test connection
echo "Testing MySQL connection..."
if [ -z "$MYSQL_PASS" ]; then
    mysql -u "$MYSQL_USER" -e "SELECT 1" > /dev/null 2>&1
else
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" -e "SELECT 1" > /dev/null 2>&1
fi

if [ $? -ne 0 ]; then
    echo "❌ Could not connect to MySQL. Check your credentials."
    exit 1
fi

echo "✅ MySQL connection successful"
echo ""

# Run the schema
echo "Creating database and tables..."
SCRIPT_DIR="$(dirname "$0")"

if [ -z "$MYSQL_PASS" ]; then
    mysql -u "$MYSQL_USER" < "$SCRIPT_DIR/backend/database/schema.sql"
else
    mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" < "$SCRIPT_DIR/backend/database/schema.sql"
fi

if [ $? -eq 0 ]; then
    echo "✅ Database 'kango_bus' created successfully!"
    echo ""
    echo "=========================================="
    echo "Setup Complete!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start the backend:  ./start-backend.sh"
    echo "2. Start the frontend: npm run dev"
    echo "3. Open http://localhost:3000"
    echo ""
    echo "To create an admin user, run:"
    echo "  mysql -u $MYSQL_USER kango_bus"
    echo "  Then execute:"
    echo "  INSERT INTO admins (email, password, full_name, is_super_admin)"
    echo "  VALUES ('admin@kango.com', '\$2y\$10\$YOUR_HASHED_PASSWORD', 'Admin', TRUE);"
    echo ""
else
    echo "❌ Failed to create database"
    exit 1
fi
