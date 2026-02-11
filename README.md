# KANGO Smart Bus Navigation

A comprehensive smart bus navigation system featuring a React frontend and a PHP backend. This application helps users find optimal bus routes, track buses, and manage transit data.

## 🚀 Features

- **Interactive Map Navigation**: Real-time bus tracking and route visualization using Leaflet.
- **Smart Routing**: Find the best bus routes between destinations.
- **User Dashboard**: Personalized experience for commuters.
- **Admin Dashboard**: Management interface for bus operators and administrators.
- **Responsive Design**: Built with TailwindCSS and Radix UI for a modern, accessible, and mobile-friendly interface.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React (with Vite)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI, Lucide React
- **Maps**: Leaflet, React Leaflet
- **charts**: Recharts

### Backend
- **Language**: PHP
- **Database**: MySQL
- **Server**: Native PHP Development Server (for local dev)

## 📂 Project Structure

- `frontend/`: The React application source code.
- `backend/`: The PHP backend API logic.
- `database/`: SQL scripts for database schema and seeding.
- `docs/`: Documentation files.
- `scripts/`: Utility scripts.

## ⚡ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- PHP (v8.0+ recommended)
- MySQL Server

### 1. Database Setup
1. Create a MySQL database (e.g., `kango_bus_app`).
2. Run the SQL scripts found in the `database/` directory to create tables and seed initial data.
3. Configure your database connection in `backend/config/Database.php` or `.env` files if applicable.

### 2. Backend Setup
Navigate to the backend directory and start the server:

```bash
cd backend
php -S localhost:8000
```
The API will be available at `http://localhost:8000`.

### 3. Frontend Setup
Navigate to the frontend directory, install dependencies, and start the development server:

```bash
cd frontend
npm install
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## 🔐 Default Login Credentials

Use the following credentials to access the protected areas of the application:

### Admin Dashboard
- **Email**: `admin@kango.com`
- **Password**: `password`

### Crew/Driver Portal
- **Email**: `john.smith@kango.com`
- **Password**: `password`


## 🌍 Live API

The production backend API is hosted at:  
**`https://kango-bus-app-production.up.railway.app`**

Ensure your frontend `.env` (or `.env.local`) points to this URL if you wish to use the live backend:
```env
VITE_API_URL=https://kango-bus-app-production.up.railway.app
```

## 📦 Deployment

This project comes with a deployment guide for Railway. Please refer to [DEPLOY.md](DEPLOY.md) for detailed instructions on how to deploy both the frontend and backend to production.

### Production Readiness

The backend includes production-ready features:
- **Health Check Endpoint**: `/health` - Comprehensive system health monitoring
- **Status Endpoint**: `/status` - Quick uptime check
- **Graceful Shutdown**: Proper cleanup during server restarts
- **Request Logging**: Automatic request/response logging with rotation
- **Environment Validation**: Startup validation of required configuration

See [docs/production-readiness.md](docs/production-readiness.md) for complete documentation.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](LICENSE)
