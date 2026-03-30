# Alrosa LearnFlow Backend

FastAPI backend in a modular style inspired by the `eyes` reference, adapted for the ALROSA LearnFlow case:
- JWT auth
- users / departments / roles
- internal courses
- external course approval workflow
- enrollments and progress
- certificates
- notifications
- audit logs
- Outlook token storage
- Railway Postgres support

## Quick start

1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Fill real secrets in `.env`
3. Run:
   ```bash
   docker compose up --build
   ```
4. Open docs:
   - http://localhost:8000/docs

## Default admin
Loaded from:
- `FIRST_SUPERUSER_EMAIL`
- `FIRST_SUPERUSER_PASSWORD`

## Important
Do not commit your real `.env` with Railway password and JWT secret.
