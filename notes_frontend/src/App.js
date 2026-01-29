import React, { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import {
  createNote,
  deleteNote,
  getConfiguredApiBaseUrl,
  listNotes,
  updateNote,
} from './api/notesApi';

function uuidFallback() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isBlank(value) {
  return !value || !String(value).trim();
}

/**
 * Normalize backend note shapes into a consistent shape.
 * We accept: id (or _id), title, content
 */
function normalizeNote(note) {
  if (!note || typeof note !== 'object') return null;
  const id = note.id ?? note._id ?? note.noteId ?? null;
  return {
    id: id ?? uuidFallback(),
    title: note.title ?? '',
    content: note.content ?? note.body ?? '',
  };
}

/**
 * When backend returns a created/updated note, normalize it.
 * If backend returns nothing, we still keep our local note.
 */
function normalizeMaybeSingleNote(data) {
  const n = normalizeNote(data);
  return n || null;
}

// PUBLIC_INTERFACE
function App() {
  /** Main Notes Manager application component (SPA). */
  const apiBase = useMemo(() => getConfiguredApiBaseUrl(), []);
  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [mode, setMode] = useState('view'); // 'view' | 'new' | 'edit'
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const titleInputRef = useRef(null);

  const selectedNote = useMemo(
    () => notes.find((n) => String(n.id) === String(selectedId)) || null,
    [notes, selectedId]
  );

  const sortedNotes = useMemo(() => {
    const copy = [...notes];
    // Prefer newest-ish if backend doesn't supply timestamps; just stable title otherwise.
    copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    return copy;
  }, [notes]);

  function setTransientStatus(message) {
    setStatus(message);
    window.clearTimeout(setTransientStatus._t);
    setTransientStatus._t = window.setTimeout(() => setStatus(''), 2500);
  }

  function startNewNote() {
    setMode('new');
    setError('');
    setStatus('');
    setDraftTitle('');
    setDraftContent('');
    setSelectedId(null);
    window.setTimeout(() => titleInputRef.current?.focus(), 50);
  }

  function startEditSelected() {
    if (!selectedNote) return;
    setMode('edit');
    setError('');
    setStatus('');
    setDraftTitle(selectedNote.title || '');
    setDraftContent(selectedNote.content || '');
    window.setTimeout(() => titleInputRef.current?.focus(), 50);
  }

  function cancelEditing() {
    setError('');
    setStatus('');
    setSaving(false);
    setDeleting(false);
    // Return to view mode; if none selected but notes exist, select first
    if (!selectedId && notes.length > 0) {
      setSelectedId(notes[0].id);
    }
    setMode('view');
  }

  async function refreshNotes({ keepSelection = true } = {}) {
    setLoading(true);
    setError('');
    try {
      const data = await listNotes();
      const normalized = (Array.isArray(data) ? data : []).map(normalizeNote).filter(Boolean);
      setNotes(normalized);

      if (normalized.length === 0) {
        setSelectedId(null);
        setMode('new');
        setDraftTitle('');
        setDraftContent('');
        window.setTimeout(() => titleInputRef.current?.focus(), 50);
        return;
      }

      if (keepSelection) {
        const stillExists =
          selectedId && normalized.some((n) => String(n.id) === String(selectedId));
        if (!stillExists) {
          setSelectedId(normalized[0].id);
        }
      } else {
        setSelectedId(normalized[0].id);
      }

      setMode('view');
    } catch (e) {
      setError(e?.message || 'Failed to load notes.');
    } finally {
      setLoading(false);
    }
  }

  async function onSaveDraft(e) {
    e?.preventDefault?.();
    setError('');
    setStatus('');

    if (isBlank(draftTitle)) {
      setError('Title is required.');
      titleInputRef.current?.focus();
      return;
    }

    setSaving(true);
    try {
      if (mode === 'new') {
        const payload = { title: draftTitle.trim(), content: draftContent || '' };
        const created = await createNote(payload);
        const normalized = normalizeMaybeSingleNote(created);

        // Optimistically update list; then refresh to match backend truth.
        if (normalized) {
          setNotes((prev) => [normalized, ...prev.filter((n) => String(n.id) !== String(normalized.id))]);
          setSelectedId(normalized.id);
        }
        setTransientStatus('Note created.');
        await refreshNotes({ keepSelection: true });
      } else if (mode === 'edit' && selectedNote) {
        const payload = { title: draftTitle.trim(), content: draftContent || '' };
        const updated = await updateNote(selectedNote.id, payload);
        const normalized = normalizeMaybeSingleNote(updated);

        if (normalized) {
          setNotes((prev) =>
            prev.map((n) => (String(n.id) === String(selectedNote.id) ? normalized : n))
          );
          setSelectedId(normalized.id);
        } else {
          setNotes((prev) =>
            prev.map((n) =>
              String(n.id) === String(selectedNote.id)
                ? { ...n, title: payload.title, content: payload.content }
                : n
            )
          );
        }
        setTransientStatus('Changes saved.');
        await refreshNotes({ keepSelection: true });
      }

      setMode('view');
    } catch (err) {
      setError(err?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function onConfirmDelete() {
    if (!selectedNote) return;

    const ok = window.confirm(`Delete “${selectedNote.title || 'Untitled'}”? This cannot be undone.`);
    if (!ok) return;

    setDeleting(true);
    setError('');
    setStatus('');
    try {
      await deleteNote(selectedNote.id);
      setTransientStatus('Note deleted.');
      // Adjust selection locally first for snappy UX
      setNotes((prev) => prev.filter((n) => String(n.id) !== String(selectedNote.id)));
      setSelectedId((prevSelected) => {
        if (String(prevSelected) !== String(selectedNote.id)) return prevSelected;
        const remaining = notes.filter((n) => String(n.id) !== String(selectedNote.id));
        return remaining[0]?.id ?? null;
      });
      await refreshNotes({ keepSelection: false });
    } catch (err) {
      setError(err?.message || 'Delete failed.');
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    refreshNotes({ keepSelection: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Keep draft in sync when switching selection in view mode
    if (mode === 'view' && selectedNote) {
      setDraftTitle(selectedNote.title || '');
      setDraftContent(selectedNote.content || '');
    }
  }, [mode, selectedNote]);

  return (
    <div className="App">
      <div className="appShell">
        <aside className="sidebar" aria-label="Notes navigation">
          <div className="sidebarHeader">
            <div>
              <div className="brandTitle">Simple Notes</div>
              <div className="brandSubtitle">Lightweight note manager</div>
            </div>

            <button className="btn btnPrimary" type="button" onClick={startNewNote}>
              New note
            </button>
          </div>

          <div className="sidebarMeta">
            <div className="pill" title="API base URL">
              API: <span className="mono">{apiBase || '(same-origin)'}</span>
            </div>
          </div>

          <div className="noteList" role="list" aria-busy={loading ? 'true' : 'false'}>
            {loading ? (
              <div className="emptyState">
                <div className="spinner" aria-hidden="true" />
                <div className="muted">Loading notes…</div>
              </div>
            ) : sortedNotes.length === 0 ? (
              <div className="emptyState">
                <div className="emptyTitle">No notes yet</div>
                <div className="muted">Create your first note to get started.</div>
              </div>
            ) : (
              sortedNotes.map((note) => {
                const active = selectedId && String(note.id) === String(selectedId);
                const preview = (note.content || '').trim().slice(0, 80);
                return (
                  <button
                    key={String(note.id)}
                    type="button"
                    className={`noteListItem ${active ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedId(note.id);
                      setMode('view');
                      setError('');
                      setStatus('');
                    }}
                    role="listitem"
                    aria-current={active ? 'true' : 'false'}
                  >
                    <div className="noteItemTitle">{note.title || 'Untitled'}</div>
                    <div className="noteItemPreview">{preview || 'No content'}</div>
                  </button>
                );
              })
            )}
          </div>

          <div className="sidebarFooter">
            <div className="muted small">
              Tip: Select a note to view it. Use <span className="kbd">New note</span> to create.
            </div>
          </div>
        </aside>

        <main className="main" aria-label="Note editor">
          <div className="mainHeader">
            <div className="mainTitle">
              {mode === 'new' ? 'Create note' : mode === 'edit' ? 'Edit note' : 'Note'}
            </div>

            <div className="headerActions">
              {mode === 'view' ? (
                <>
                  <button
                    className="btn btnSecondary"
                    type="button"
                    onClick={startEditSelected}
                    disabled={!selectedNote}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btnDanger"
                    type="button"
                    onClick={onConfirmDelete}
                    disabled={!selectedNote || deleting}
                  >
                    {deleting ? 'Deleting…' : 'Delete'}
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btnSecondary" type="button" onClick={cancelEditing} disabled={saving}>
                    Cancel
                  </button>
                  <button className="btn btnPrimary" type="submit" form="noteForm" disabled={saving}>
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </>
              )}
            </div>
          </div>

          {error ? (
            <div className="alert alertError" role="alert">
              <div className="alertTitle">Something went wrong</div>
              <div className="alertBody">{error}</div>
            </div>
          ) : null}

          {status ? (
            <div className="alert alertSuccess" role="status">
              <div className="alertBody">{status}</div>
            </div>
          ) : null}

          <div className="card">
            {mode === 'view' ? (
              selectedNote ? (
                <div className="noteView">
                  <h2 className="noteViewTitle">{selectedNote.title || 'Untitled'}</h2>
                  <div className="noteViewContent">
                    {(selectedNote.content || '').trim() ? (
                      selectedNote.content
                    ) : (
                      <span className="muted">No content.</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="emptyMain">
                  <div className="emptyTitle">Select a note</div>
                  <div className="muted">Choose one from the list, or create a new note.</div>
                  <button className="btn btnPrimary mt16" type="button" onClick={startNewNote}>
                    Create a note
                  </button>
                </div>
              )
            ) : (
              <form id="noteForm" className="noteForm" onSubmit={onSaveDraft}>
                <label className="field">
                  <span className="fieldLabel">Title</span>
                  <input
                    ref={titleInputRef}
                    className="input"
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="e.g., Meeting notes"
                    maxLength={120}
                    aria-required="true"
                  />
                </label>

                <label className="field">
                  <span className="fieldLabel">Content</span>
                  <textarea
                    className="textarea"
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    placeholder="Write your note here…"
                    rows={14}
                  />
                </label>

                <div className="formHint muted small">
                  Notes are saved to the backend API configured via{' '}
                  <span className="mono">REACT_APP_API_BASE</span> or{' '}
                  <span className="mono">REACT_APP_BACKEND_URL</span>.
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
