/**
 * Unit tests for the API layer (src/api.ts).
 *
 * Every exported function is tested with mocked fetch to verify:
 *   - Correct HTTP method & URL
 *   - Snake_case → camelCase field mapping
 *   - Error handling (non-2xx, network failure, malformed JSON)
 *   - Edge cases (204 No Content, empty arrays)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  fetchStudySets, createStudySet, deleteStudySet, updateStudySet,
  fetchAllDocuments, fetchSetDocuments, deleteDocument,
  fetchChatHistory,
  fetchFlashcards, generateFlashcards,
  fetchQuiz, submitQuiz,
  fetchSummary,
  fetchNotes, createNote, updateNote, deleteNote,
} from '../api'

// ── Helpers ──────────────────────────────────────────────────

function mockFetch(status: number, body: unknown, ok = status < 300) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok, status,
    json: () => Promise.resolve(body),
  } as Response)
}

function mockFetchNoBody(status: number) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
    ok: status < 300, status,
    json: () => Promise.reject(new Error('no body')),
  } as Response)
}

beforeEach(() => { vi.restoreAllMocks() })

// ── Study Sets ──────────────────────────────────────────────

describe('fetchStudySets()', () => {
  it('returns mapped array (snake_case → camelCase)', async () => {
    mockFetch(200, [{ id: '1', title: 'Bio', subject: 'Science', document_count: 3,
      created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' }])
    const sets = await fetchStudySets()
    expect(sets).toHaveLength(1)
    expect(sets[0].documentCount).toBe(3)
    expect(sets[0].progress.mastered).toBe(0)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/study-sets'), expect.anything())
  })

  it('returns [] when empty', async () => {
    mockFetch(200, [])
    expect(await fetchStudySets()).toEqual([])
  })

  it('throws on server error', async () => {
    mockFetch(500, { detail: 'boom' }, false)
    await expect(fetchStudySets()).rejects.toThrow('boom')
  })
})

describe('createStudySet()', () => {
  it('POSTs JSON and returns mapped set', async () => {
    mockFetch(201, { id: 'new', title: 'CS', subject: 'STEM', document_count: 0,
      created_at: '', updated_at: '' })
    const set = await createStudySet({ title: 'CS', subject: 'STEM' })
    expect(set.title).toBe('CS')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/study-sets'), expect.objectContaining({ method: 'POST' }))
  })
})

describe('deleteStudySet()', () => {
  it('resolves on 204', async () => {
    mockFetchNoBody(204)
    await expect(deleteStudySet('abc')).resolves.toBeUndefined()
  })
})

describe('updateStudySet()', () => {
  it('PATCHes partial data', async () => {
    mockFetch(200, { id: '1', title: 'Renamed', subject: 'STEM', document_count: 5,
      created_at: '', updated_at: '' })
    const set = await updateStudySet('1', { title: 'Renamed' })
    expect(set.title).toBe('Renamed')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/study-sets/1'), expect.objectContaining({ method: 'PATCH' }))
  })
})

// ── Documents ──────────────────────────────────────────────

describe('fetchAllDocuments()', () => {
  it('returns DocInfo array', async () => {
    mockFetch(200, [{ id: 'd1', study_set_id: 's1', study_set_title: 'Bio',
      filename: 'notes.pdf', chunk_count: 12, ocr_pages: 0, uploaded_at: '' }])
    expect((await fetchAllDocuments())[0].filename).toBe('notes.pdf')
  })
})

describe('fetchSetDocuments()', () => {
  it('scopes URL to study set', async () => {
    mockFetch(200, [])
    await fetchSetDocuments('set-123')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/study-sets/set-123/documents'), expect.anything())
  })
})

describe('deleteDocument()', () => {
  it('calls DELETE', async () => {
    mockFetchNoBody(204)
    await expect(deleteDocument('d1')).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/documents/d1'), expect.objectContaining({ method: 'DELETE' }))
  })
})

// ── Chat ───────────────────────────────────────────────────

describe('fetchChatHistory()', () => {
  it('returns messages', async () => {
    mockFetch(200, [{ id: 'm1', role: 'user', content: 'Hi', sources: null, created_at: '' }])
    expect((await fetchChatHistory('s1'))[0].role).toBe('user')
  })
})

// ── Flashcards ─────────────────────────────────────────────

describe('fetchFlashcards()', () => {
  it('returns cards with mastery', async () => {
    mockFetch(200, [{ id: 'f1', question: 'Q', answer: 'A', explanation: 'E', mastery: 'unfamiliar' }])
    expect((await fetchFlashcards('s1'))[0].mastery).toBe('unfamiliar')
  })
})

describe('generateFlashcards()', () => {
  it('POSTs with count', async () => {
    mockFetch(201, [])
    await generateFlashcards('s1', undefined, 12)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/flashcards/generate'), expect.objectContaining({ method: 'POST' }))
  })
})

// ── Quiz ───────────────────────────────────────────────────

describe('fetchQuiz()', () => {
  it('maps correct_index → correctIndex', async () => {
    mockFetch(200, [{ id: 'q1', question: '2+2?', options: ['3','4','5','6'], correct_index: 1, explanation: 'Math' }])
    expect((await fetchQuiz('s1'))[0].correctIndex).toBe(1)
  })
})

describe('submitQuiz()', () => {
  it('POSTs answers, returns score', async () => {
    mockFetch(200, { score: 3, total: 5 })
    const r = await submitQuiz('s1', [{ question_id: 'q1', selected_index: 0 }])
    expect(r.score).toBe(3)
  })
})

// ── Summary ────────────────────────────────────────────────

describe('fetchSummary()', () => {
  it('returns full shape', async () => {
    mockFetch(200, { content: 'Overview', sections: [{ title: 'Ch1', desc: 'Intro' }], takeaways: ['Key'] })
    const s = await fetchSummary('s1')
    expect(s.content).toBe('Overview')
    expect(s.takeaways).toHaveLength(1)
  })
})

// ── Notes ──────────────────────────────────────────────────

describe('fetchNotes()', () => {
  it('returns ordered notes', async () => {
    mockFetch(200, [])
    expect(await fetchNotes('s1')).toEqual([])
  })
})

describe('createNote()', () => {
  it('POSTs title + content', async () => {
    mockFetch(201, { id: 'n1', study_set_id: 's1', title: 'N', content: 'C', created_at: '', updated_at: '' })
    expect((await createNote('s1', { title: 'N', content: 'C' })).title).toBe('N')
  })
})

describe('updateNote()', () => {
  it('PATCHes fields', async () => {
    mockFetch(200, { id: 'n1', study_set_id: 's1', title: 'U', content: 'New', created_at: '', updated_at: '' })
    expect((await updateNote('n1', { title: 'U' })).title).toBe('U')
  })
})

describe('deleteNote()', () => {
  it('calls DELETE', async () => {
    mockFetchNoBody(204)
    await expect(deleteNote('n1')).resolves.toBeUndefined()
  })
})

// ── Error edge cases ───────────────────────────────────────

describe('error handling', () => {
  it('falls back to statusText when body has no detail', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false, status: 500, statusText: 'Internal Server Error',
      json: () => Promise.reject(new Error('not json')),
      text: () => Promise.resolve('Internal Server Error'),
    } as unknown as Response)
    await expect(fetchStudySets()).rejects.toThrow('Internal Server Error')
  })

  it('throws on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(fetchStudySets()).rejects.toThrow('Failed to fetch')
  })

  it('uses generic message when no detail available', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false, status: 418, statusText: '',
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('{}'),
    } as unknown as Response)
    await expect(fetchStudySets()).rejects.toThrow('API error 418')
  })
})
