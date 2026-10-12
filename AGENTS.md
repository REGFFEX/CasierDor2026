# Base44 Dev Environment

## Project Overview
Casier d'Or — a Vite + React 19 + TypeScript single-page app for deposit/store management (French UI). Uses IndexedDB for local data persistence and Supabase for optional cloud auth/sync. No separate backend service; the frontend is the only app process.

## Setup
- `docker compose -f docker-compose.base44.yml up -d` starts the Vite dev server on port 3000.
- Node 22 slim image; deps installed on container startup via `npm install`.
- Source is bind-mounted at `/app`; live reload is active (Vite HMR).

## Known Issues Fixed
1. **`utils/testDataGenerator.ts:145`** — unescaped apostrophe in `'45 Avenue de l'Indépendance'` broke esbuild's dependency scan. Fixed by switching to double quotes.
2. **`index.css`** — `@import './styles/unified-list.css'` was placed after `@tailwind` directives, violating CSS `@import` ordering rules. Fixed by moving `@import` to the top of the file.

## Verification
- Curl `http://localhost:3000/` returns HTTP 200 with the app HTML.
- The login page ("Connexion") renders with no console errors.
- Container healthcheck passes (fetches localhost:3000).

## Notes
- Supabase env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are optional — the app falls back to local-only mode (IndexedDB) when they are absent.
- The `index.html` contains an importmap pointing to esm.sh for React/react-dom; this coexists with the local npm packages without conflict.
- Remaining Tauri references in code are comments only (no build impact).
