# Alrosa LearnFlow Backend

FastAPI backend for the ALROSA LearnFlow case with:
- JWT auth
- role model: admin / hr / manager / employee / trainer
- external course workflow: employee -> manager -> hr
- HR metrics dashboard API
- internal calendar events
- real Outlook Calendar integration via Microsoft Graph OAuth 2.0 authorization code flow
- Railway Postgres support

## Quick start

1. Open `back/.env` and fill:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OUTLOOK_CLIENT_ID`
   - `OUTLOOK_CLIENT_SECRET`
   - `OUTLOOK_TOKEN_ENCRYPTION_KEY`
2. In Azure App Registration set redirect URI:
   - `http://localhost:8000/api/v1/calendar/outlook/callback`
3. Run backend:
   ```bash
   cd back
   docker compose up --build
   ```
4. Run frontend in another terminal:
   ```bash
   cd alrosa-obuchenie-frontend
   npm install
   npm run dev
   ```

## Outlook flow

1. Employee opens `/calendar`
2. Clicks `Подключить Outlook`
3. Authorizes Microsoft account
4. Backend stores encrypted access / refresh token in `user_outlook_tokens`
5. After HR approve, system creates an internal calendar event and then creates a real Outlook event through Microsoft Graph

## Important

Do not commit your real `.env` with Railway password, JWT secret, or Outlook client secret.
