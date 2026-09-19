# KANGO Smart Bus Navigation

KANGO is a competition prototype for planning bus journeys, viewing live bus
locations, and managing transit data. It combines a React/TypeScript frontend
with a PHP/MySQL API and includes separate commuter, crew, and administrator
experiences.

> **Project status:** Prototype. The user interface and demo mode are suitable
> for demonstration, but the application has not been audited or load-tested
> for production use.

## Features

- Interactive Leaflet map and route visualisation
- Journey planning and estimated arrival information
- Commuter, crew, and administrator dashboards
- Saved places, favourite routes, and notification settings
- Optional Stripe payment-method integration
- Demo mode for exploring the interface without a backend

## Technology

| Area | Stack |
| --- | --- |
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Radix UI |
| Maps | Leaflet and React Leaflet |
| Backend | PHP 8 and a JSON API |
| Database | MySQL 8 |
| Payments | Stripe PHP and Stripe.js |

## Repository layout

```text
backend/    PHP API, services, and configuration
database/   Schema and sample data
docs/       Architecture, API, setup, and deployment notes
frontend/   React application
scripts/    Local development helpers
tests/      PHP integration and verification scripts
```

## Local development

### Requirements

- Node.js 18 or later
- npm 9 or later
- PHP 8.0 or later with PDO MySQL and JSON extensions
- MySQL 8
- Composer (when using Stripe-backed endpoints)

### 1. Configure the database and backend

```bash
mysql -u root -p < database/schema/tables.sql
cp backend/.env.example backend/.env
cd backend
composer install
php -S localhost:8000 index.php
```

Update `backend/.env` with your database details and generate a strong
`JWT_SECRET`. Do not use the example secret outside local development.

### 2. Start the frontend

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open <http://localhost:5173>. Vite proxies local `/api` requests to the PHP
server at `http://localhost:8000`.

For a hosted API, copy the root `.env.example` values into
`frontend/.env.local` and set `VITE_API_URL` to the API origin.

## Quality checks

```bash
cd frontend
npm run typecheck
npm run build
```

GitHub Actions runs these checks and lints every PHP file for each pull
request. The PHP scripts in `tests/` require a configured backend and database.

## Documentation

- [Architecture](docs/architecture.md)
- [Detailed setup](docs/setup.md)
- [API reference](docs/api-reference.md)
- [Deployment](docs/deployment.md)
- [Production-readiness notes](docs/production-readiness.md)

## Security

Never commit `.env` files, database credentials, JWT secrets, or Stripe keys.
The sample accounts and demo credentials are for local demonstration only.

## License

Licensed under the [MIT License](LICENSE).
