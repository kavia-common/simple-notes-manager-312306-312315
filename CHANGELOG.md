# Changelog

## [0.1.0] - 2026-01-29

This is the initial documented release of Simple Notes Manager.

The frontend is a React single-page application with a sidebar + main editor layout. It supports creating, editing, viewing, and deleting notes with basic loading/error/status messaging.

The API client is implemented with the browser `fetch` API and resolves its base URL from `REACT_APP_API_BASE` (preferred) or `REACT_APP_BACKEND_URL` (fallback). It also attempts compatibility with common endpoint prefixes by trying both `/notes` and `/api/notes`, and it enforces a request timeout using `AbortController`.
