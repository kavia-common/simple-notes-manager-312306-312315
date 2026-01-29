# Simple Notes Manager — Frontend Developer Guide

## Overview

The frontend is a small React single-page application (Create React App) that manages a list of notes and provides a view/edit experience using a sidebar + main content layout.

## Project structure

Within `simple-notes-manager-312306-312315/notes_frontend/`:

- `src/App.js` contains the main UI, state management, and CRUD orchestration.
- `src/api/notesApi.js` contains the HTTP client for the notes backend.
- `src/App.css` contains the application theme variables and component styles.
- `src/App.test.js` contains a basic render test for the app title.
- `src/index.js` renders the app into the DOM root.

## Key files

### `src/App.js`

`App` is the primary component and owns:

- `notes`: in-memory list of notes loaded from the backend
- `selectedId`: currently selected note identifier
- `mode`: `'view' | 'new' | 'edit'`
- `draftTitle`, `draftContent`: form fields used in new/edit modes
- `loading`, `saving`, `deleting`: UI state flags
- `error`, `status`: message state shown to the user

It normalizes backend notes in the UI layer to support different backend shapes. It accepts identifiers from `id`, `_id`, or `noteId`, and accepts content from `content` or `body`.

The component uses `useEffect` to load notes on mount and to keep draft state in sync when switching notes in view mode.

### `src/api/notesApi.js`

This module provides:

- `listNotes()`
- `createNote(note)`
- `updateNote(id, note)`
- `deleteNote(id)`
- `getConfiguredApiBaseUrl()`

It resolves the API base URL using `REACT_APP_API_BASE` or `REACT_APP_BACKEND_URL`, and defaults to same-origin when unset. It enforces a 15s timeout and normalizes error messages.

### `src/App.css`

The app uses a light theme with CSS variables defined on `:root`, including:

- `--primary: #3b82f6` (primary accent)
- `--success: #06b6d4` (success accent)
- `--bg: #f9fafb` (page background)
- `--surface: #ffffff` (card backgrounds)
- `--text: #111827` (main text)

Layout is implemented via a two-column CSS grid (`.appShell`) with responsive behavior collapsing to one column on smaller screens.

## UI behavior (CRUD)

Creating a note:

- Click “New note” in the sidebar.
- The app enters `mode === 'new'`, clears drafts, and focuses the title input.
- Title is required; blank titles are rejected with an error and focus is returned to title.

Editing a note:

- Select a note in the sidebar.
- Click “Edit”.
- The app enters `mode === 'edit'` and pre-fills drafts from the selected note.

Saving:

- “Save” submits the form and calls the API client.
- On success, the app shows a transient status message and refreshes the notes from the backend.

Deleting:

- In view mode, click “Delete”.
- The app uses `window.confirm(...)` for confirmation.
- On success, it removes the note locally for responsiveness, then refreshes.

## Testing

The current test is a basic smoke test in `src/App.test.js` using Testing Library:

- It renders `<App />`
- It asserts the title “Simple Notes” is present

To run tests:

```bash
cd simple-notes-manager-312306-312315/notes_frontend
CI=true npm test
```

If you add tests that rely on API behavior, consider mocking the API client module (`src/api/notesApi.js`) and/or `global.fetch`.

## Style conventions

This project uses plain CSS (no CSS-in-JS and no UI framework). Prefer:

- Reusing existing CSS variables in `:root` for colors, spacing, and focus rings.
- Keeping components visually consistent with existing `.btn*`, `.card`, `.alert`, and list item styles.
- Avoiding heavy dependencies unless the scope clearly justifies them.

## Accessibility considerations

The UI includes several accessibility features already:

- Semantic regions: `<aside aria-label="Notes navigation">` and `<main aria-label="Note editor">`
- Loading state: the list has `aria-busy`
- Error alert: error messages use `role="alert"`
- Status messages: success status uses `role="status"`
- Keyboard focus: list items and buttons support focus, with `:focus-visible` styling

When adding features, keep labels explicit, ensure focus management remains sensible (especially after navigation and CRUD actions), and avoid introducing non-semantic clickable elements that are not keyboard accessible.

Task completed: Frontend developer guide added with project structure, key files, behaviors, testing, styling, and accessibility notes.
