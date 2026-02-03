# KANGO - Detailed Setup Guide

Complete setup instructions for development and production environments.

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js  | 18+     | Frontend runtime |
| npm      | 9+      | Package manager |
| PHP      | 8.0+    | Backend runtime |
| MySQL    | 8.0+    | Database |

### PHP Extensions Required

- `pdo`
- `pdo_mysql`
- `json`
- `mbstring`

Check your PHP installation:
```bash
php -m | grep -E "pdo|json|mbstring"
```

---

## Local Development Setup

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd kango-smart-bus
```

### Step 2: Database Setup

1. **Start MySQL Server**
   ```bash
   # macOS (Homebrew)
   brew services start mysql
   
   # Linux (systemd)
   sudo systemctl start mysql
   
   # Windows
   # Start MySQL from Services or XAMPP
   ```

2. **Create Database and Tables**
   ```bash
   mysql -u root -p < database/schema/tables.sql
   ```

3. **Load Sample Data (Optional)**
   ```bash
   mysql -u root -p kango_bus < database/seeds/sample-data.sql
   ```

### Step 3: Backend Setup

1. **Navigate to backend**
   ```bash
   cd backend
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure database connection** (edit `.env`):
   ```env
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_DATABASE=kango_bus
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   JWT_SECRET=your-secure-secret-key
   ```

4. **Start PHP server**
   ```bash
   php -S localhost:8000 index.php
   ```

### Step 4: Frontend Setup

1. **Navigate to frontend** (new terminal)
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Step 5: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

---

## Test Accounts

### Admin
| Field    | Value            |
|----------|------------------|
| Email    | admin@kango.com  |
| Password | password         |

### Crew Members
| Name          | Email                      | Password |
|---------------|----------------------------|----------|
| John Smith    | john.smith@kango.com       | password |
| Sarah Johnson | sarah.johnson@kango.com    | password |
| Mike Davis    | mike.davis@kango.com       | password |

### Users
Register a new user account through the app, or use prototype mode with demo credentials.

---

## Prototype Mode (No Backend)

For UI testing without a backend:

1. Open the app at http://localhost:3000
2. Click **"Enable Prototype Mode"** on the Welcome Screen
3. Use demo credentials:
   - **User:** `demo@kango.com` / `password123`
   - **Crew Driver:** `DRV001` / `password123`
   - **Admin:** `admin@kango.com` / `password123`

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### MySQL Connection Refused

1. Check if MySQL is running:
   ```bash
   mysql.server status
   ```

2. Verify credentials in `backend/.env`

3. Check MySQL user permissions:
   ```sql
   GRANT ALL PRIVILEGES ON kango_bus.* TO 'your_user'@'localhost';
   ```

### CORS Errors

If you see CORS errors in the browser console, ensure:
1. Backend is running on port 8000
2. Frontend Vite proxy is configured correctly
3. Check `backend/config/config.php` for allowed origins

### Node Modules Issues

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```
