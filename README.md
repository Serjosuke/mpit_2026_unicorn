# Alrosa LearnFlow

Patched project with real Microsoft Graph / Outlook Calendar integration, two-step approval workflow, HR dashboard metrics, internal calendar, and ready-to-run `.env` templates.


## Smart external search update
- `GET /api/v1/courses/external-search?q=...` — unified search for HR, managers, and employees.
- Uses OpenAI Responses API with built-in web search when `OPENAI_API_KEY` is set. Falls back to local catalog when key is absent.
- HR can favorite external courses and assign them to one or many employees.
- Employees can submit external courses for approval with justification.
- Recommended HR favorites are pushed to the top of results; internal courses remain highest-priority in schedule conflicts.
