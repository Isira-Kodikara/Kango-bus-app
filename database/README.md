# KANGO Database

This directory contains all database-related files for the KANGO Smart Bus Navigation system.

## Directory Structure

```
database/
├── schema/
│   └── tables.sql      # All table definitions and indexes
├── seeds/
│   └── sample-data.sql # Sample data for development/testing
└── migrations/         # Future: Database migrations
```

## Setup Instructions

### Local Development (MySQL)

1. **Start MySQL Server**
   ```bash
   # macOS (Homebrew)
   brew services start mysql
   
   # Or start manually
   mysql.server start
   ```

2. **Create the database and tables**
   ```bash
   mysql -u root -p < database/schema/tables.sql
   ```

3. **Load sample data (optional)**
   ```bash
   mysql -u root -p kango_bus < database/seeds/sample-data.sql
   ```

### Railway (Production)

1. Add a MySQL database to your Railway project
2. Connect to the database using Railway's MySQL shell
3. Copy and paste the contents of `schema/tables.sql`
4. Optionally run `seeds/sample-data.sql` for initial data

## Default Test Credentials

After loading sample data, you can use these credentials:

| Role  | Email                      | Password  |
|-------|----------------------------|-----------|
| Admin | admin@kango.com            | password  |
| Crew  | john.smith@kango.com       | password  |
| Crew  | sarah.johnson@kango.com    | password  |
| Crew  | mike.davis@kango.com       | password  |

⚠️ **Warning**: Change these passwords in production!

## Tables Overview

| Table             | Description                          |
|-------------------|--------------------------------------|
| `users`           | Passenger accounts                   |
| `crew`            | Bus drivers and conductors           |
| `admins`          | System administrators                |
| `routes`          | Bus routes                           |
| `stops`           | Bus stops with GPS coordinates       |
| `route_stops`     | Route-stop relationships             |
| `buses`           | Fleet management                     |
| `schedule`        | Route schedules                      |
| `trips`           | User journey records                 |
| `payments`        | Transaction records                  |
| `wait_requests`   | "Wait for me" feature requests       |
| `emergency_alerts`| Safety emergency alerts              |
| `emergency_contacts` | User emergency contacts           |
| `saved_locations` | User saved places (home, work, etc.) |
| `user_sessions`   | JWT session management               |
| `analytics`       | Daily analytics data                 |
| `crew_reports`    | Crew incident reports                |
