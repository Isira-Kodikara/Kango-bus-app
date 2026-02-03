# KANGO - API Reference

API documentation for the KANGO Smart Bus Navigation backend.

## Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://your-backend.up.railway.app`

## Authentication

Most endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

---

## User Authentication API

Base path: `/auth/user.php`

### Register User

```http
POST /auth/user.php?action=register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user_id": 1,
    "email": "john@example.com"
  }
}
```

### Login User

```http
POST /auth/user.php?action=login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe"
    }
  }
}
```

### Verify OTP

```http
POST /auth/user.php?action=verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

### Resend OTP

```http
POST /auth/user.php?action=resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Forgot Password

```http
POST /auth/user.php?action=forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Reset Password

```http
POST /auth/user.php?action=reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

### Get Profile (Authenticated)

```http
GET /auth/user.php?action=profile
Authorization: Bearer <token>
```

### Update Profile (Authenticated)

```http
POST /auth/user.php?action=update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "phone": "+94771234567"
}
```

---

## Crew Authentication API

Base path: `/auth/crew.php`

### Crew Login

```http
POST /auth/crew.php?action=login
Content-Type: application/json

{
  "email": "john.smith@kango.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "crew": {
      "id": 1,
      "full_name": "John Smith",
      "email": "john.smith@kango.com",
      "assigned_bus": {
        "id": 1,
        "bus_number": "BUS-45",
        "route": {
          "id": 1,
          "route_number": "R001",
          "route_name": "Downtown Express"
        }
      }
    }
  }
}
```

### Start Trip (Authenticated)

```http
POST /auth/crew.php?action=start-trip
Authorization: Bearer <token>
Content-Type: application/json

{
  "bus_id": 1,
  "route_id": 1
}
```

### End Trip (Authenticated)

```http
POST /auth/crew.php?action=end-trip
Authorization: Bearer <token>
Content-Type: application/json

{
  "trip_id": 1
}
```

### Update Location (Authenticated)

```http
POST /auth/crew.php?action=update-location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 6.9271,
  "longitude": 79.8612
}
```

---

## Admin Authentication API

Base path: `/auth/admin.php`

### Admin Login

```http
POST /auth/admin.php?action=login
Content-Type: application/json

{
  "email": "admin@kango.com",
  "password": "password"
}
```

### Get Dashboard Stats (Authenticated)

```http
GET /auth/admin.php?action=dashboard
Authorization: Bearer <token>
```

### Get All Users (Authenticated)

```http
GET /auth/admin.php?action=users
Authorization: Bearer <token>
```

### Get All Crew (Authenticated)

```http
GET /auth/admin.php?action=crew
Authorization: Bearer <token>
```

### Get All Buses (Authenticated)

```http
GET /auth/admin.php?action=buses
Authorization: Bearer <token>
```

### Get All Routes (Authenticated)

```http
GET /auth/admin.php?action=routes
Authorization: Bearer <token>
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `USER_NOT_FOUND` | 404 | User doesn't exist |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_TOKEN` | 401 | JWT token is invalid |
| `UNAUTHORIZED` | 403 | Insufficient permissions |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `SERVER_ERROR` | 500 | Internal server error |

---

## Rate Limiting

- **Development:** No limits
- **Production:** 100 requests per minute per IP

---

## CORS

The API allows requests from:
- `http://localhost:3000` (development)
- `http://localhost:5173` (Vite default)
- Configured production domains

Configure allowed origins in `backend/.env`:
```env
CORS_ORIGINS=https://your-frontend.vercel.app
```
