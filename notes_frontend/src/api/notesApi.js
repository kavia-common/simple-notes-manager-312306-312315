const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Resolve the backend base URL from supported environment variables.
 * Preference order:
 *  - REACT_APP_API_BASE
 *  - REACT_APP_BACKEND_URL
 *  - '' (relative to current origin)
 */
function getApiBaseUrl() {
  const base =
    (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || '').trim();

  // Allow leaving it empty to use same-origin (useful for proxies / preview setups).
  return base.replace(/\/+$/, '');
}

async function fetchJson(path, options = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

    if (!res.ok) {
      const message =
        (payload && typeof payload === 'object' && (payload.detail || payload.message)) ||
        (typeof payload === 'string' && payload) ||
        `Request failed with status ${res.status}`;

      const err = new Error(message);
      err.status = res.status;
      err.payload = payload;
      throw err;
    }

    return payload;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please try again.');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/**
 * Attempt to normalize different possible backend response shapes into an array of notes.
 * Supports:
 *  - [ {id,title,content}, ... ]
 *  - { items: [...] }
 *  - { notes: [...] }
 */
function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  if (data && Array.isArray(data.notes)) return data.notes;
  return [];
}

/**
 * Try multiple common endpoint shapes to increase compatibility with unknown backend implementations.
 */
async function tryGetNotes() {
  const candidates = ['/notes', '/api/notes'];
  let lastErr = null;

  for (const path of candidates) {
    try {
      const data = await fetchJson(path, { method: 'GET' });
      return normalizeListResponse(data);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Unable to load notes.');
}

async function tryCreateNote(note) {
  const candidates = ['/notes', '/api/notes'];
  let lastErr = null;

  for (const path of candidates) {
    try {
      return await fetchJson(path, { method: 'POST', body: JSON.stringify(note) });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Unable to create note.');
}

async function tryUpdateNote(id, note) {
  const candidates = [`/notes/${id}`, `/api/notes/${id}`];
  let lastErr = null;

  for (const path of candidates) {
    try {
      return await fetchJson(path, { method: 'PUT', body: JSON.stringify(note) });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Unable to update note.');
}

async function tryDeleteNote(id) {
  const candidates = [`/notes/${id}`, `/api/notes/${id}`];
  let lastErr = null;

  for (const path of candidates) {
    try {
      return await fetchJson(path, { method: 'DELETE' });
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('Unable to delete note.');
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Fetch all notes from the backend. */
  return tryGetNotes();
}

// PUBLIC_INTERFACE
export async function createNote(note) {
  /** Create a new note ({title, content}) via backend API. */
  return tryCreateNote(note);
}

// PUBLIC_INTERFACE
export async function updateNote(id, note) {
  /** Update an existing note via backend API. */
  return tryUpdateNote(id, note);
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note via backend API. */
  return tryDeleteNote(id);
}

// PUBLIC_INTERFACE
export function getConfiguredApiBaseUrl() {
  /** Returns the resolved API base URL (useful for UI diagnostics). */
  return getApiBaseUrl();
}
