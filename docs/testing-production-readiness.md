# Production Readiness Testing Guide

## Quick Test Commands

### 1. Test Health Check Endpoint

```bash
# Start the backend server
cd backend
php -S localhost:8000 index.php

# In another terminal, test the health endpoint
curl http://localhost:8000/health | json_pp
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-02-11T15:00:00+05:30",
  "version": "1.0",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful"
    },
    "php": {
      "status": "healthy",
      "version": "8.x.x",
      "message": "PHP version is supported"
    },
    "extensions": {
      "status": "healthy",
      "message": "All required extensions loaded"
    },
    "environment": {
      "status": "healthy",
      "message": "All required environment variables are set"
    }
  }
}
```

### 2. Test Status Endpoint

```bash
curl http://localhost:8000/status
```

**Expected Response:**
```json
{
  "success": true,
  "status": "online",
  "message": "KANGO API is running",
  "timestamp": "2026-02-11T15:00:00+05:30"
}
```

### 3. Test Request Logging

```bash
# Make a test request
curl http://localhost:8000/api/get-routes

# Check the logs
cat backend/logs/requests-$(date +%Y-%m-%d).log
```

**Expected Log Entry:**
```json
[REQUEST] [2026-02-11 15:00:00] {"request_id":"req_abc123","timestamp":"2026-02-11 15:00:00","method":"GET","uri":"/api/get-routes","ip":"127.0.0.1"}
[RESPONSE] [2026-02-11 15:00:00] {"request_id":"req_abc123","timestamp":"2026-02-11 15:00:00","status_code":200,"duration_ms":45.23}
```

### 4. Test Environment Validation

```bash
# Temporarily rename .env to test validation
mv backend/.env backend/.env.backup

# Start server - should fail with validation error
php -S localhost:8000 backend/index.php

# Restore .env
mv backend/.env.backup backend/.env
```

### 5. Test Graceful Shutdown

```bash
# Start server
cd backend
php -S localhost:8000 index.php

# In another terminal, send SIGTERM
pkill -TERM php

# Check logs for shutdown messages
tail backend/logs/php-errors.log
```

## Manual Testing Checklist

- [ ] Health endpoint returns 200 when all systems healthy
- [ ] Health endpoint returns 503 when database unavailable
- [ ] Status endpoint always returns 200
- [ ] Request logs are created in `backend/logs/`
- [ ] Old logs are automatically cleaned (30+ days)
- [ ] Environment validation catches missing variables
- [ ] Production mode disables error display
- [ ] Graceful shutdown logs cleanup messages

## Production Deployment Verification

After deploying to production:

1. **Test Health Endpoint**
   ```bash
   curl https://your-api.com/health
   ```

2. **Set Up Monitoring**
   - Configure uptime monitor for `/status`
   - Configure health checks for `/health`
   - Set up alerts for 503 responses

3. **Verify Logging**
   - Check that logs are being written
   - Verify log rotation is working
   - Ensure logs are excluded from git

4. **Security Check**
   - Verify `display_errors` is OFF
   - Confirm JWT secret is secure (not default)
   - Check CORS configuration

## Troubleshooting

### Port Already in Use
If you get "Operation not permitted" or "Address already in use":
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
php -S localhost:8080 index.php
```

### Database Connection Failed
1. Check database is running
2. Verify credentials in `.env`
3. Test connection manually:
   ```bash
   mysql -h localhost -u root -p kango_bus
   ```

### Logs Not Writing
1. Create logs directory:
   ```bash
   mkdir -p backend/logs
   chmod 755 backend/logs
   ```

2. Check PHP error log:
   ```bash
   tail -f backend/logs/php-errors.log
   ```

## Next Steps

Once all tests pass:
1. Deploy to production
2. Configure monitoring
3. Set up log aggregation
4. Enable alerting
5. Document runbook procedures
