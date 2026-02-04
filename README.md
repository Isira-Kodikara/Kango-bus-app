# KANGO Smart Bus Navigation
> **Status:** Deployment Active 🚀 | Last Updated: Feb 4, 2026

A comprehensive smart bus navigation system with real-time tracking, user management, and crew operations.

## 📁 Project Structure

```
kango-smart-bus/
├── frontend/           # React + Vite frontend
├── backend/            # PHP REST API backend
├── database/           # Database schemas & seeds
├── docs/               # Documentation
└── scripts/            # Development scripts
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **PHP** 8.0+ with PDO MySQL extension
- **MySQL** 8.0+

### 1. Database Setup

```bash
# Create database and tables
mysql -u root -p < database/schema/tables.sql

# Load sample data (optional)
mysql -u root -p kango_bus < database/seeds/sample-data.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials

# Start PHP server
php -S localhost:8000 index.php
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### 4. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000

## 🔐 Default Credentials

| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@kango.com          | password  |
| Crew  | john.smith@kango.com     | password  |
| User  | (Register a new account) | -         |

See [database/README.md](database/README.md) for more test credentials.

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [docs/setup.md](docs/setup.md) | Detailed setup instructions |
| [docs/api-reference.md](docs/api-reference.md) | API endpoints documentation |
| [docs/deployment.md](docs/deployment.md) | Deployment guides (Vercel, Railway) |
| [docs/architecture.md](docs/architecture.md) | System architecture overview |

## 🛠️ Development

### Running Both Servers

**Option 1: Two Terminals**
```bash
# Terminal 1 - Backend
./scripts/start-backend.sh

# Terminal 2 - Frontend
cd frontend && npm run dev
```

**Option 2: Using npm scripts (from frontend/)**
```bash
npm run dev        # Start frontend only
npm run backend    # Start backend only
```

### Prototype Mode (No Backend Required)

The frontend supports a prototype mode for UI testing without the backend:
1. Click "Enable Prototype Mode" on the Welcome Screen
2. Use demo credentials to explore the UI

## 🚢 Deployment

### Frontend → Vercel

```bash
cd frontend
vercel deploy
```

### Backend → Railway

```bash
cd backend
railway init
railway up
```

See [docs/deployment.md](docs/deployment.md) for detailed instructions.

## 📱 Features

### For Passengers (Users)
- 🔐 Login/Register with OTP verification
- 🚌 Real-time bus tracking on map
- 📍 Find nearby bus stops
- ⏰ Wait for me requests
- 🚨 Emergency alerts
- ⭐ Save favorite locations

### For Bus Crew
- 🎯 Start/End trip management
- 📊 Passenger counting
- 📍 Live location updates
- 🚨 Emergency reporting

### For Administrators
- 👥 User & crew management
- 🚌 Fleet management
- 📈 Analytics dashboard
- 🛣️ Route management

## 🏗️ Tech Stack

| Layer    | Technology |
|----------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Backend  | PHP 8.0, PDO, Custom JWT |
| Database | MySQL 8.0 |
| Maps     | Leaflet, React-Leaflet |

## 📄 License

This project is proprietary software for KANGO Smart Bus Navigation system.
