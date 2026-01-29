# Simple Notes Manager — API Integration Guide

## Overview

The Simple Notes Manager frontend talks to a backend Notes API over HTTP. The frontend API client is implemented in `notes_frontend/src/api/notesApi.js` and is responsible for:

- Resolving the API base URL from environment variables
- Sending HTTP requests with JSON headers
- Enforcing a request timeout (15 seconds)
- Normalizing error messages for display in the UI
- Trying multiple endpoint prefixes to support different backends

## Base URL resolution

The API client resolves the backend base URL using the following precedence order:

1. `process.env.REACT_APP_API_BASE`
2. `process.env.REACT_APP_BACKEND_URL`
3. `''` (empty string, meaning same-origin requests)

Trailing slashes are removed, and then request paths are appended.

Examples:

- If `REACT_APP_API_BASE=https://api.example.com`, a request to `/notes` becomes `https://api.example.com/notes`.
- If `REACT_APP_API_BASE` and `REACT_APP_BACKEND_URL` are empty, a request to `/notes` stays `/notes` and is sent to the same origin that serves the frontend.

## Endpoint discovery strategy

To increase compatibility with unknown backend implementations, the client tries these candidates:

- List notes: `GET /notes`, then `GET /api/notes`
- Create note: `POST /notes`, then `POST /api/notes`
- Update note: `PUT /notes/:id`, then `PUT /api/notes/:id`
- Delete note: `DELETE /notes/:id`, then `DELETE /api/notes/:id`

The first successful response is used. If all candidates fail, the last error is thrown.

## Expected data shapes

The UI expects each note to have (at minimum) a title and content, and an identifier. The UI layer will attempt to normalize common variants:

- `id` or `_id` or `noteId` are accepted as the identifier field.
- `content` or `body` are accepted as the content field.

### List response normalization

The client normalizes list responses for these shapes:

- An array: `[ { ...note }, ... ]`
- A wrapper object: `{ items: [ ... ] }`
- A wrapper object: `{ notes: [ ... ] }`

If the response does not match these shapes, the client returns an empty list.

## Endpoints (CRUD)

### List notes

Request:

```http
GET /notes
Accept: application/json
```

Possible responses:

```json
[
  { "id": "1", "title": "Groceries", "content": "Milk\nEggs" }
]
```

Or:

```json
{ "items": [ { "id": "1", "title": "Groceries", "content": "Milk\nEggs" } ] }
```

### Get a note (optional)

The current frontend does not call a dedicated “get by id” endpoint. It selects a note from the list already loaded in memory. If a backend implements `GET /notes/:id`, it is not currently required by the UI.

### Create note

Request:

```http
POST /notes
Content-Type: application/json
Accept: application/json
```

Body:

```json
{ "title": "Meeting notes", "content": "Agenda..." }
```

The backend may return the created note. If it does, the UI will use it optimistically before refreshing the list.

### Update note

Request:

```http
PUT /notes/:id
Content-Type: application/json
Accept: application/json
```

Body:

```json
{ "title": "Updated title", "content": "Updated content" }
```

The backend may return the updated note. If it does not, the UI will still update local state using the submitted payload and then refresh the list.

### Delete note

Request:

```http
DELETE /notes/:id
Accept: application/json
```

The backend may return an empty response or a JSON payload. The UI treats a successful HTTP status as success and then refreshes the list.

## Error handling conventions

The client parses responses as JSON when the `content-type` includes `application/json`. If the response status is not OK (`res.ok === false`), it constructs an `Error` with a message using:

- `payload.detail` or `payload.message` (if the payload is an object), otherwise
- the payload string (if the payload is text), otherwise
- `Request failed with status <status>`

The error object also includes:

- `err.status`: HTTP status code
- `err.payload`: parsed payload (object or string)

Timeouts are enforced using `AbortController`. If a request times out, the client throws an error with:

- `message`: `Request timed out. Please try again.`
- `code`: `TIMEOUT`

The UI displays `error.message` inside an alert component.

Task completed: API integration guide added documenting URL resolution, endpoint expectations, and client error behavior.
