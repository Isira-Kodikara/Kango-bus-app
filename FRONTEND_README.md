# KANGO Frontend

React/Vite frontend for KANGO Smart Bus Navigation system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run at `http://localhost:3000`

## Two Modes of Operation

### 1. Prototype Mode (No Backend Required)

Perfect for UI testing and demos. Uses mock data stored in the browser.

**To enable:**
- Click the "Enable Prototype Mode" button on the Welcome Screen
- Or run in browser console: `enablePrototypeMode()`

**Demo Credentials (Prototype Mode):**
| Role | Credentials |
|------|-------------|
| User | Email: `demo@kango.com`, Password: `password123` |
| Crew (Driver) | Crew ID: `DRV001`, Password: `password123` |
| Crew (Conductor) | Crew ID: `CND001`, Password: `password123` |
| Admin | Email: `admin@kango.com`, Password: `password123` |

### 2. Connected Mode (With Backend)

For full functionality with real data persistence.

**Requirements:**
- KANGO Backend running on `http://localhost:8000`

**To disable prototype mode:**
- Click the yellow "Prototype Mode ON" button to turn it off
- Or run in browser console: `disablePrototypeMode()`

## Project Structure

```
src/
├── App.tsx                 # Main app component
├── routes.ts              # React Router configuration
├── main.tsx               # Entry point
├── components/            # UI Components
│   ├── WelcomeScreen.tsx  # Role selection
│   ├── UserAuth.tsx       # User login/register
│   ├── UserHome.tsx       # User dashboard
│   ├── CrewAuth.tsx       # Crew login
│   ├── CrewDashboard.tsx  # Crew controls
│   ├── AdminAuth.tsx      # Admin login
│   ├── AdminDashboard.tsx # Admin panel
│   └── ui/                # Reusable UI components
├── contexts/
│   └── AuthContext.tsx    # Authentication state
├── lib/
│   ├── api.ts             # API service (auto-switches modes)
│   └── mockApi.ts         # Mock data for prototype mode
└── styles/
    └── globals.css        # Global styles
```

## Features

### User Features
- 🔐 Login/Register with OTP verification
- 🚌 Real-time bus tracking
- 📍 View nearby bus stops
- ⭐ Save favorite stops
- 🚨 Emergency alerts

### Crew Features
- 🎯 Start/End trips
- 📊 Passenger counting
- 📍 Location updates
- 🚨 Emergency reporting

### Admin Features
- 👥 Manage users and crew
- 🚌 Bus fleet management
- 📈 Analytics dashboard
- ⚙️ System settings

## API Integration

The frontend automatically detects if the backend is available:

```typescript
// In any component
import { authApi } from '../lib/api';

// This works in both prototype and connected mode
const response = await authApi.login({
  email: 'demo@kango.com',
  password: 'password123'
});

if (response.success) {
  console.log('Logged in!', response.data.user);
}
```

## Building for Production

```bash
npm run build
```

Output will be in the `build/` directory.

## Environment Variables

Create `.env.local` for custom configuration:

```env
VITE_API_URL=http://your-api-server.com
```
