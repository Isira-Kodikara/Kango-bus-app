# KANGO - System Architecture

Technical architecture overview for the KANGO Smart Bus Navigation system.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                     │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Passenger  │  │    Crew     │  │    Admin    │  │   Future    │    │
│  │  Mobile App │  │  Mobile App │  │  Dashboard  │  │ Native Apps │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
└─────────┼────────────────┼────────────────┼────────────────┼────────────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Vercel)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   React 18 + TypeScript + Vite                                          │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  Components    │  Contexts     │  Services    │  Styles         │   │
│   │  ────────────  │  ──────────   │  ──────────  │  ──────────     │   │
│   │  • UserAuth    │  • AuthCtx    │  • api.ts    │  • Tailwind     │   │
│   │  • UserHome    │               │  • mockApi   │  • Radix UI     │   │
│   │  • CrewDash    │               │              │                 │   │
│   │  • AdminDash   │               │              │                 │   │
│   │  • Map         │               │              │                 │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Railway)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   PHP 8.0 + Custom Routing                                              │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  API Routes         │  Includes        │  Config                │   │
│   │  ─────────────────  │  ──────────────  │  ──────────────────    │   │
│   │  /auth/user.php     │  • Database.php  │  • config.php          │   │
│   │  /auth/crew.php     │  • JWT.php       │  • Environment vars    │   │
│   │  /auth/admin.php    │  • OTP.php       │                        │   │
│   │                     │  • Validator.php │                        │   │
│   │                     │  • Response.php  │                        │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PDO / MySQL Protocol
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATABASE (Railway MySQL)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   MySQL 8.0                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  User Tables       │  Operations      │  System                 │   │
│   │  ────────────────  │  ──────────────  │  ──────────────────     │   │
│   │  • users           │  • routes        │  • user_sessions        │   │
│   │  • crew            │  • stops         │  • analytics            │   │
│   │  • admins          │  • route_stops   │  • crew_reports         │   │
│   │  • emergency_*     │  • buses         │                         │   │
│   │  • saved_locations │  • schedule      │                         │   │
│   │                    │  • trips         │                         │   │
│   │                    │  • payments      │                         │   │
│   │                    │  • wait_requests │                         │   │
│   └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | React 18 | UI rendering |
| Language | TypeScript | Type safety |
| Build Tool | Vite | Fast bundling |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | Radix UI | Accessible primitives |
| Routing | React Router | Client-side routing |
| State | Context API | Global state |
| Maps | React-Leaflet | Map visualization |
| Icons | Lucide React | Icon library |

### Directory Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── ui/              # Reusable UI components (Radix-based)
│   │   ├── figma/           # Figma-specific components
│   │   ├── UserAuth.tsx     # User authentication
│   │   ├── UserHome.tsx     # User dashboard
│   │   ├── CrewAuth.tsx     # Crew authentication
│   │   ├── CrewDashboard.tsx
│   │   ├── AdminAuth.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Map.tsx          # Leaflet map component
│   │   └── ...
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── lib/
│   │   ├── api.ts           # API service layer
│   │   └── mockApi.ts       # Mock data for prototype mode
│   ├── styles/
│   │   └── globals.css      # Global styles
│   ├── App.tsx              # Root component
│   ├── routes.ts            # Route definitions
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json
├── vite.config.ts
└── tsconfig.json
```

### Data Flow

```
User Action
    │
    ▼
Component (e.g., UserAuth)
    │
    ▼
API Service (api.ts)
    │
    ├──▶ Prototype Mode? ──▶ mockApi.ts ──▶ Local Storage
    │
    └──▶ Connected Mode ──▶ fetch() ──▶ Backend API
    │
    ▼
Response
    │
    ▼
Update State (Context / Component)
    │
    ▼
Re-render UI
```

---

## Backend Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Language | PHP 8.0 | Server-side logic |
| Database | PDO | Database abstraction |
| Auth | Custom JWT | Token-based auth |
| Server | PHP Built-in (dev) | Development server |
| Server | Railway (prod) | Production hosting |

### Directory Structure

```
backend/
├── api/
│   └── auth/
│       ├── user.php         # User endpoints
│       ├── crew.php         # Crew endpoints
│       └── admin.php        # Admin endpoints
├── config/
│   └── config.php           # Configuration
├── includes/
│   ├── Database.php         # Database connection
│   ├── JWT.php              # JWT utilities
│   ├── OTP.php              # OTP generation
│   ├── Response.php         # API response helpers
│   └── Validator.php        # Input validation
├── index.php                # Entry point / router
├── composer.json            # Dependencies
├── nixpacks.toml            # Railway config
└── Procfile                 # Heroku config
```

### Request Flow

```
HTTP Request
    │
    ▼
index.php (Router)
    │
    ├── /auth/user/* ──▶ api/auth/user.php
    ├── /auth/crew/* ──▶ api/auth/crew.php
    └── /auth/admin/* ──▶ api/auth/admin.php
    │
    ▼
Action Handler (switch on ?action=)
    │
    ├── Validate Input (Validator.php)
    ├── Check Auth (JWT.php)
    ├── Database Query (Database.php)
    │
    ▼
Response.php ──▶ JSON Response
```

---

## Database Schema

### Entity Relationship Diagram (Simplified)

```
┌─────────┐       ┌─────────┐       ┌─────────┐
│  users  │       │  crew   │       │ admins  │
└────┬────┘       └────┬────┘       └─────────┘
     │                 │
     │                 │ assigned_bus_id
     │                 ▼
     │           ┌─────────┐       ┌─────────┐
     │           │  buses  │◄──────│ routes  │
     │           └────┬────┘       └────┬────┘
     │                │                 │
     │                │                 │
     ▼                ▼                 ▼
┌─────────┐     ┌─────────┐       ┌─────────┐
│  trips  │◄────│schedule │       │  stops  │
└─────────┘     └─────────┘       └────┬────┘
     │                                  │
     ▼                                  ▼
┌─────────┐                      ┌───────────┐
│payments │                      │route_stops│
└─────────┘                      └───────────┘
```

### Key Relationships

| Relationship | Description |
|--------------|-------------|
| `crew` → `buses` | Each crew member is assigned to one bus |
| `buses` → `routes` | Each bus operates on one route |
| `routes` ↔ `stops` | Many-to-many via `route_stops` |
| `users` → `trips` | Users take multiple trips |
| `trips` → `buses` | Each trip is on a specific bus |
| `trips` → `payments` | Each trip has a payment record |

---

## Security

### Authentication Flow

```
1. User submits credentials
       │
       ▼
2. Backend validates against database
       │
       ▼
3. If valid, generate JWT token
       │
       ▼
4. Return token to frontend
       │
       ▼
5. Frontend stores token (localStorage)
       │
       ▼
6. Include token in Authorization header
       │
       ▼
7. Backend validates token on each request
```

### Security Measures

| Measure | Implementation |
|---------|----------------|
| Password Hashing | bcrypt (`password_hash()`) |
| Token Auth | JWT with HS256 |
| CORS | Whitelist allowed origins |
| Input Validation | Server-side validation |
| SQL Injection | PDO prepared statements |
| XSS | React auto-escaping |

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          PRODUCTION                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐      ┌─────────────────┐                  │
│   │    VERCEL       │      │    RAILWAY      │                  │
│   │   (Frontend)    │      │   (Backend)     │                  │
│   │                 │      │                 │                  │
│   │  ┌───────────┐  │      │  ┌───────────┐  │                  │
│   │  │  React    │──┼──────┼─▶│   PHP     │  │                  │
│   │  │  Static   │  │ API  │  │   API     │  │                  │
│   │  └───────────┘  │      │  └─────┬─────┘  │                  │
│   │                 │      │        │        │                  │
│   │  CDN: Global    │      │        ▼        │                  │
│   │                 │      │  ┌───────────┐  │                  │
│   └─────────────────┘      │  │   MySQL   │  │                  │
│                            │  │ Database  │  │                  │
│                            │  └───────────┘  │                  │
│                            │                 │                  │
│                            └─────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Future Considerations

### Scalability
- Add Redis for session caching
- Implement WebSockets for real-time updates
- Add load balancing for high traffic

### Features
- Native mobile apps (React Native)
- Push notifications
- Payment gateway integration
- Advanced analytics dashboard

### DevOps
- CI/CD pipeline (GitHub Actions)
- Docker containerization
- Automated testing
- Monitoring and alerting
