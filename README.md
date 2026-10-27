# Simple YouTube-style comment DB

## Start the database

```bash
docker compose up -d
```

## Seed sample data

```bash
node seed.js
```

This creates a small PostgreSQL database with sample users, videos, comments, and likes so the project starts with real data instead of an empty table.
