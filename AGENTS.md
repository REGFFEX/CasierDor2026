# AGENTS.md — Base44 Setup Notes

## Project Overview
**Casier d'Or** is a Vite + React 19 + TypeScript SPA for gold/depot deposit management (French UI). It is a frontend-only app with no backend server.

## Architecture
- **Build tool**: Vite 6, dev server on port 3000 (host 0.0.0.0, strictPort)
- **Routing**: react-router-dom with HashRouter (client-side only)
- **State**: localStorage-based store (`store.ts`), React Context for auth/theme/language
- **Auth**: Offline-first. Falls back to localStorage auth with a seeded admin user (`admin@casierdor.app` / `admin123`) when Supabase env vars are absent. Supabase integration is optional (gated by `isSupabaseConfigured()` checking `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`).
- **Sync**: Cloud sync is disabled for the local MVP (`utils/syncEngine.ts`).

## Running the App
```bash
docker compose -f docker-compose.base44.yml up -d
```
The container installs npm dependencies and starts `vite` with live reload. Source is bind-mounted, so edits appear immediately.

## No External Credentials Required
The app boots fully without any secrets. Optional integrations:
- **Supabase** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`): enables cloud auth/database. Without them, the app uses localStorage.
- **Gemini API** (`GEMINI_API_KEY`): AI features. Without it, those features are unavailable but the app works.

## Known Warnings
- CSS `@import` ordering warnings from PostCSS are non-fatal and don't affect rendering.
