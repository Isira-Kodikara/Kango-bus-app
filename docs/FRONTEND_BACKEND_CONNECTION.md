# Connecting Frontend and Backend - KANGO Smart Bus Navigation

## Overview

This guide explains how the React frontend connects to the PHP backend in this project.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React + Vite)                   │
│                         Port: 3000                               │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  Components │───▶│  API Layer  │───▶│  Vite Proxy         │  │
│  │  (UserAuth) │    │  (api.ts)   │    │  /api → :8000       │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend (PHP)                             │
│                         Port: 8000                               │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │  index.php  │───▶│  API Routes │───▶│  Database (MySQL)   │  │
│  │  (Router)   │    │  /auth/*    │    │  kango_bus          │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Make sure you have PHP 8.0+ installed
php --version

# Make sure you have MySQL installed
mysql --version
```

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create the database and run the schema
source backend/database/schema.sql
```

### 3. Configure Backend

Edit `backend/config/config.php`:

```php
// Update these with your MySQL credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'kango_bus');
define('DB_USER', 'your_username');
define('DB_PASS', 'your_password');

// Change this in production!
define('JWT_SECRET', 'your-super-secret-key-here');
```

### 4. Start Both Servers

**Terminal 1 - Start PHP Backend:**
```bash
cd backend
php -S localhost:8000
```

**Terminal 2 - Start React Frontend:**
```bash
npm run dev
```

The frontend will run on `http://localhost:3000` and automatically proxy API requests to the PHP backend.

## How It Works

### 1. API Service Layer (`src/lib/api.ts`)

This file contains all API functions for communicating with the backend:

```typescript
// Example: Login a user
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

if (response.success) {
  // User is logged in, token is stored automatically
  console.log(response.data.user);
}
```

### 2. Auth Context (`src/contexts/AuthContext.tsx`)

Provides global authentication state:

```typescript
// In any component
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <p>Please log in</p>;
  }
  
  return <p>Welcome, {user.username}!</p>;
}
```

### 3. Vite Proxy (`vite.config.ts`)

During development, requests to `/api/*` are proxied to the PHP backend:

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
},
```

This means:
- Frontend calls: `fetch('/api/auth/user.php?action=login')`
- Actually goes to: `http://localhost:8000/auth/user.php?action=login`

## API Endpoints

### User Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/user.php?action=register` | POST | Register new user |
| `/api/auth/user.php?action=login` | POST | Login user |
| `/api/auth/user.php?action=verify-otp` | POST | Verify OTP |
| `/api/auth/user.php?action=resend-otp` | POST | Resend OTP |
| `/api/auth/user.php?action=forgot-password` | POST | Request password reset |
| `/api/auth/user.php?action=reset-password` | POST | Reset password |

### Crew Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/crew.php?action=login` | POST | Crew login |

### Admin Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/admin.php?action=login` | POST | Admin login |

## Example API Calls

### Register a User

```typescript
import { authApi } from '@/lib/api';

const response = await authApi.register({
  username: 'johndoe',
  email: 'john@example.com',
  password: 'securepassword123'
});

if (response.success) {
  // OTP was sent to email
  // Show OTP verification screen
}
```

### Verify OTP

```typescript
const response = await authApi.verifyOTP({
  email: 'john@example.com',
  otp: '123456'
});

if (response.success) {
  // User is now logged in
  // Token is stored automatically
}
```

### Protected API Calls

The API layer automatically includes the auth token in requests:

```typescript
import { api } from '@/lib/api';

// This will include the Authorization header automatically
const response = await api.get('/user/profile.php');
```

## Production Deployment

For production, you'll need to:

1. **Build the frontend:**
   ```bash
   npm run build
   ```

2. **Configure your web server (Apache/Nginx)** to:
   - Serve the built frontend from `build/` directory
   - Route `/api/*` requests to your PHP backend
   - Set up SSL/HTTPS

3. **Update `backend/config/config.php`:**
   - Disable error display
   - Use environment variables for sensitive data
   - Update CORS origins

Example Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/kango/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        alias /var/www/kango/backend/;
        try_files $uri $uri/ =404;
        
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }
}
```

## Troubleshooting

### CORS Errors
- Make sure the PHP backend is running
- Check that `config.php` has proper CORS headers

### 404 Errors
- Verify the PHP server is running on port 8000
- Check the Vite proxy configuration

### Authentication Issues
- Check browser dev tools → Network tab for response details
- Verify JWT_SECRET matches between requests
- Check token expiry (default: 24 hours)

### Database Connection Errors
- Verify MySQL is running
- Check credentials in `config.php`
- Ensure database `kango_bus` exists
