# KANGO Smart Bus Navigation - Login Credentials

## 🔐 User Accounts

### Regular User
| Field | Value |
|-------|-------|
| Email | `test@example.com` |
| Password | `password123` |
| Username | `testuser` |

> **Note:** You can also register new users through the app. OTP verification is currently **disabled** for development.

---

## 👨‍✈️ Crew Accounts

| Name | Email | Password | NIC | Bus |
|------|-------|----------|-----|-----|
| John Smith | `john.smith@kango.com` | `password` | 123456789V | BUS-45 |
| Sarah Johnson | `sarah.johnson@kango.com` | `password` | 987654321V | BUS-12 |
| Mike Davis | `mike.davis@kango.com` | `password` | 456789123V | BUS-89 |

---

## 🛡️ Admin Account

| Field | Value |
|-------|-------|
| Email | `admin@kango.com` |
| Password | `password` |
| Full Name | System Admin |
| Role | Super Admin |

---

## 🗄️ Database Configuration

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Database Name | `kango_bus` |
| Username | `root` |
| Password | *(empty)* |

---

## 🔑 JWT Secret Key

```
kango_secret_key_change_in_production_2026
```

> ⚠️ **Important:** Change this key in production!

---

## 🚀 How to Run the App

### Terminal 1 - Start Backend (PHP)
```bash
cd "/Users/isirakodikara/Documents/KANGO Smart Bus Navigation UI 2/backend"
php -S localhost:8000 index.php
```

### Terminal 2 - Start Frontend (React)
```bash
cd "/Users/isirakodikara/Documents/KANGO Smart Bus Navigation UI 2"
npm run dev
```

### Access the App
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

---

## 📍 Sample Colombo Bus Stops

| Stop Name | Code | Coordinates |
|-----------|------|-------------|
| Fort Railway Station | FRT | 6.9344, 79.8428 |
| Pettah Bus Stand | PTH | 6.9366, 79.8500 |
| Kollupitiya Junction | KLP | 6.9114, 79.8489 |
| Bambalapitiya | BBP | 6.8897, 79.8553 |
| Wellawatte | WLW | 6.8747, 79.8594 |
| Dehiwala | DHW | 6.8564, 79.8650 |
| Mount Lavinia | MLV | 6.8390, 79.8660 |
| Town Hall | TWH | 6.9167, 79.8636 |
| Borella Junction | BRL | 6.9147, 79.8778 |
| Maradana | MRD | 6.9289, 79.8675 |
| Nugegoda | NGD | 6.8722, 79.8883 |
| Maharagama | MHR | 6.8481, 79.9267 |

---

## 🚌 Sample Bus Routes

| Route # | Name | Path |
|---------|------|------|
| 100 | Coastal Line | Fort → Pettah → Kollupitiya → Bambalapitiya → Wellawatte → Dehiwala → Mount Lavinia |
| 138 | City Circle | Fort → Pettah → Maradana → Borella → Town Hall → Kollupitiya |
| 155 | Southern Express | Fort → Town Hall → Borella → Nugegoda → Maharagama |

---

## 🧪 API Test Commands

### Test User Login
```bash
curl -X POST http://localhost:8000/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Admin Login
```bash
curl -X POST http://localhost:8000/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kango.com","password":"password"}'
```

### Test Crew Login
```bash
curl -X POST http://localhost:8000/auth/crew/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.smith@kango.com","password":"password"}'
```

### Register New User
```bash
curl -X POST http://localhost:8000/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"newuser","email":"newuser@example.com","password":"password123"}'
```

---

*Last updated: February 1, 2026*
