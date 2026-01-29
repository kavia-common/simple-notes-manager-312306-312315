# Simple Notes Manager — Ops / Deployment Guide

## Overview

This project’s frontend is a Create React App build (static files) that must be configured to talk to a backend Notes API. Most deployment issues come down to base URL configuration and cross-origin behavior.

## Environment configuration by environment

Create React App environment variables are read at build time, not dynamically at runtime. That means:

- If you change `REACT_APP_*` values, you generally need to rebuild and redeploy the frontend artifacts.
- In development, you must restart `npm start` after changing `.env`.

Recommended setup patterns:

### Local development

- Set `REACT_APP_API_BASE` to a local backend (for example `http://localhost:8000`) if the backend runs on a different port, or
- Leave it empty if you run a local reverse proxy that routes `/notes` or `/api/notes` to the backend.

### Staging / preview

- Set `REACT_APP_API_BASE` to the preview backend URL.
- Ensure CORS allows the preview frontend origin if frontend and backend are on different hosts.

### Production

- Prefer serving the frontend and backend behind the same origin (reverse proxy) to avoid CORS complexity, or
- Use `REACT_APP_API_BASE=https://api.yourdomain.com` and ensure strict HTTPS everywhere.

## How preview works (user-managed previews)

In Kavia-style preview environments, the frontend may be served from a preview URL and the backend may be separate. The frontend can either:

- Call the backend via an explicit base URL (`REACT_APP_API_BASE`), or
- Call same-origin and rely on the preview platform (or a reverse proxy) to route `/notes` or `/api/notes` to the backend

The sidebar shows the resolved API base URL at runtime for quick verification.

## Logging levels and diagnostics

The frontend currently does not implement a structured client logger. If `REACT_APP_LOG_LEVEL` is set, it is informational unless you add a logger wrapper.

For diagnosing issues in any environment:

- Use browser devtools (Network tab) to confirm the full request URL
- Confirm response status codes and payloads
- Check console output for CORS errors and failed fetches

## Healthcheck path guidance

`REACT_APP_HEALTHCHECK_PATH` is not currently used by the React app itself, but it can be helpful for platform configuration if you serve the frontend behind a reverse proxy.

Typical approaches:

- Serve a static `index.html` and allow healthchecks to hit `/` (frontend availability)
- Provide a backend health endpoint (for example `/health`) and configure platform healthchecks there
- If using a proxy, ensure healthchecks do not require authentication and are fast

## Common deployment pitfalls

### CORS failures

If the frontend origin differs from the backend origin and you set `REACT_APP_API_BASE` to the backend, the backend must allow the frontend origin via CORS. Symptoms include browser console errors and requests blocked before reaching your app logic.

Mitigations include:

- Use a same-origin reverse proxy in front of both services.
- Configure backend CORS allowlist for the deployed frontend URL.

### Incorrect API base URL

If `REACT_APP_API_BASE` points to the wrong host, requests will fail or time out. Confirm the exact URL in the UI’s sidebar “API:” pill.

### Missing `/api` prefix mismatches

The client tries both `/notes` and `/api/notes`. If your backend uses a different base path entirely, you must either:

- Adjust the backend routing to support one of those endpoints, or
- Update the frontend API client to include the correct path

### HTTPS mixed content

If your frontend is served over HTTPS, your backend must also be HTTPS. Otherwise the browser will block “mixed content” requests.

### Caching stale configuration

Because CRA env vars are compiled into the bundle, a CDN or aggressive caching can serve a bundle that still points at the old backend URL. Make sure you invalidate caches when changing API configuration.

Task completed: Deployment guide added with environment setup patterns and common operational pitfalls.
