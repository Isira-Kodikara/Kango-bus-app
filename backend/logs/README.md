# KANGO Backend Logs

This directory contains application logs for monitoring and debugging.

## Log Files

- `requests-YYYY-MM-DD.log` - Daily request logs with timing and status information
- Logs are automatically rotated and kept for 30 days

## Log Format

Each log entry is in JSON format with the following structure:

```json
{
  "request_id": "req_unique_id",
  "timestamp": "2026-02-11 14:56:40",
  "method": "POST",
  "uri": "/api/trip-guidance",
  "ip": "192.168.1.1",
  "status_code": 200,
  "duration_ms": 45.23,
  "memory_mb": 2.5
}
```

## Security Note

**Do not commit log files to version control.** They may contain sensitive information.

The `.gitignore` file should exclude `*.log` files.
