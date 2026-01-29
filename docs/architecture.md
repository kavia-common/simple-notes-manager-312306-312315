# Simple Notes Manager — Architecture Overview

## Overview

Simple Notes Manager is a single-page React application that provides a sidebar-driven note browser and a main panel for viewing and editing note content. The frontend depends on a backend HTTP API to persist notes, and it is designed to work either with an explicit API base URL (via environment variables) or with same-origin routing (via a reverse proxy).

## Architecture Diagram

The system is composed of a React SPA and an external backend API.

At a high level: the user interacts with the React UI, the UI calls an API client module, and the API client sends HTTP requests to the backend. The backend returns JSON (or errors), which the UI uses to update local state.

## Core Components

The frontend is intentionally small and centered around a few core elements.

The main React application component lives in `notes_frontend/src/App.js`. It owns the UI state for the note list, the currently selected note, the editing mode, and transient status/error messages. It also triggers data fetching and refresh behavior on startup and after CRUD operations.

The API client lives in `notes_frontend/src/api/notesApi.js`. It resolves the backend base URL from environment variables, performs requests using `fetch`, enforces a timeout, normalizes error messages, and tries multiple endpoint prefixes (`/notes` and `/api/notes`) for compatibility.

The layout and theme are defined in `notes_frontend/src/App.css`. The UI is a light theme with a modern “card + sidebar” layout. The primary accent color is `#3b82f6` and the success accent color is `#06b6d4`, both provided as CSS variables.

## Data Flow

On initial load, the application calls `listNotes()` and normalizes the returned data into a consistent note shape in the UI layer. If no notes are returned, the UI switches into “new note” mode and focuses the title input.

When the user creates a note, the UI validates that the title is not blank, calls `createNote({title, content})`, applies an optimistic list update (if the backend returns a note), and then refreshes the full list from the backend to reconcile state.

When the user edits a note, the UI calls `updateNote(id, {title, content})`, updates the in-memory note if possible, and refreshes the list.

When the user deletes a note, the UI prompts for confirmation using `window.confirm`, calls `deleteNote(id)`, removes the note from local state for responsiveness, adjusts the selection, and refreshes the list.

## Integration Points

The frontend integrates with an external backend API over HTTP. All note persistence is delegated to this backend. The API base URL is configured at runtime via environment variables and is resolved by the API client module.

The frontend also integrates with the browser runtime for `fetch`, `AbortController` (timeouts), and `window.confirm` (delete confirmation).

## Technology Stack

The frontend is built with React 18 and Create React App (`react-scripts`). Styling is implemented with plain CSS. API calls are made using the browser `fetch` API, with a small wrapper around JSON parsing and error normalization.

## Key Design Decisions

The app keeps state management inside the main `App` component using React hooks (`useState`, `useEffect`, `useMemo`, `useRef`). This is sufficient for the current size of the application and avoids introducing additional dependencies.

The API client attempts multiple common endpoint prefixes (`/notes` and `/api/notes`) to increase compatibility with different backend implementations without requiring code changes.

The UI uses a clear “mode” state (`view`, `new`, `edit`) to keep view logic explicit and to ensure the correct header actions (Edit/Delete vs Save/Cancel) are rendered.

## Scalability & Performance

For the current scope, the app fetches the full note list and keeps it in memory. For large note sets, future improvements could include pagination, server-side sorting, and incremental fetching. The app currently sorts notes client-side and uses memoization to reduce unnecessary recomputation.

The API client uses a 15 second request timeout to prevent the UI from hanging indefinitely when the backend is slow or unreachable.

## Security Considerations

The current frontend does not implement authentication, authorization, or token handling. All requests are unauthenticated and rely on the backend to enforce any required access controls.

If the frontend is deployed on a different origin than the backend, CORS must be configured safely on the backend. When using environment variables to point to an external API, ensure HTTPS is used in production to protect note content in transit.
