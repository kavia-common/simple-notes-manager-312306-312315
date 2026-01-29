# Simple Notes Manager

A lightweight notes application where users can create, edit, and delete notes. The UI is a single-page React app with a sidebar for navigation and a main area for viewing/editing a note. Notes are persisted via a backend API.

## Documentation

- [Architecture overview](docs/architecture.md)
- [API integration guide](docs/api.md)
- [Frontend developer guide](docs/frontend.md)
- [Ops / deployment guide](docs/deployment.md)
- [Security policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

## Features

The current React UI supports:

- Viewing a list of notes in a left sidebar
- Creating a new note (title required)
- Editing an existing note
- Deleting a note with a confirmation prompt
- Basic loading and error states
- API base URL visibility in the sidebar (diagnostics)

## Tech stack

- React 18
- Create React App (react-scripts)
- Vanilla CSS (no UI framework)
- Fetch API (for HTTP calls)

## Repository layout

This repository contains the frontend app under:

- `notes_frontend/` – React application

## Local development

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
cd simple-notes-manager-312306-312315/notes_frontend
npm install
```

### Run the frontend (dev)

```bash
npm start
```

By default, Create React App runs on http://localhost:3000.

### Run tests

```bash
CI=true npm test
```

### Build for production

```bash
npm run build
```

The build output is produced in `notes_frontend/build/`.

## Environment variables

The frontend uses Create React App environment variables (prefixed with `REACT_APP_`). The API client uses these variables to decide where to send requests.

### Core API configuration

- `REACT_APP_API_BASE`: Base URL for the backend API. This takes precedence over `REACT_APP_BACKEND_URL`. If unset/empty, the app uses same-origin requests (useful when a reverse proxy or preview environment routes `/api`).
- `REACT_APP_BACKEND_URL`: Alternate base URL for the backend API if `REACT_APP_API_BASE` is not set.

### URLs and environment metadata

- `REACT_APP_FRONTEND_URL`: Public URL of the frontend (useful for deployments, links, and backend CORS configuration).
- `REACT_APP_WS_URL`: WebSocket base URL, if real-time features are added in the future.
- `REACT_APP_NODE_ENV`: Environment label for runtime behavior (commonly `development` or `production`). Note: CRA also sets `NODE_ENV`; this variable is app-specific.
- `REACT_APP_PORT`: Port for local/dev usage (informational unless you wire it into scripts).
- `REACT_APP_TRUST_PROXY`: Deployment setting typically used by backends behind a reverse proxy (informational for the frontend unless you integrate it).
- `REACT_APP_LOG_LEVEL`: Desired client log verbosity (informational unless you implement a logger wrapper).
- `REACT_APP_HEALTHCHECK_PATH`: Path that a platform healthcheck can probe (more relevant to a backend or reverse proxy; included for consistency).
- `REACT_APP_NEXT_TELEMETRY_DISABLED`: Included for compatibility with other stacks; not used by this CRA frontend.
- `REACT_APP_ENABLE_SOURCE_MAPS`: If you implement build-time toggles for source maps, this can control them (CRA uses `GENERATE_SOURCEMAP`; this is currently informational).
- `REACT_APP_FEATURE_FLAGS`: A string that can hold feature flags (for example JSON like `{"newEditor":true}`); not currently consumed by the UI.
- `REACT_APP_EXPERIMENTS_ENABLED`: Boolean-like toggle for experimental features; not currently consumed by the UI.

For details on how the API base URL is resolved, see [docs/api.md](docs/api.md).

## Build/run notes

- The UI reads environment variables at build time (Create React App behavior). If you change env vars, restart the dev server.
- If `REACT_APP_API_BASE` is blank, the app will send requests to `/notes` or `/api/notes` on the same origin.

## Troubleshooting

### “Failed to load notes”

- Verify your backend is running and reachable.
- Confirm `REACT_APP_API_BASE` (or `REACT_APP_BACKEND_URL`) points to the correct origin (including protocol and port).
- Check for CORS errors in the browser devtools console if the backend is on a different origin.

### Requests time out

The API client uses a 15 second timeout. If requests are consistently timing out:

- Confirm network connectivity and backend responsiveness
- Check that `REACT_APP_API_BASE` does not point to an incorrect host
- Consider increasing timeout in `notes_frontend/src/api/notesApi.js` if needed

### Build fails

- Run `npm install` again to ensure dependencies are present.
- Ensure you are using a compatible Node.js version (LTS recommended).

## Contributing

### Suggested workflow

1. Create a branch for your change.
2. Make your edits with small, reviewable commits.
3. Run tests (`CI=true npm test`) and ensure `npm run build` succeeds.
4. Open a pull request describing the change and how it was verified.

### Code style

- Keep UI logic in `src/App.js` organized and readable.
- Prefer small helper functions for normalization and validation.
- Keep CSS in `src/App.css` consistent with the existing light theme and variables.

Task completed: Root project README added/updated with setup, env vars, and links to supporting docs.
