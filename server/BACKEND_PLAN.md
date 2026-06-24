# Backend Implementation Plan

## Overview

Local-first backend that powers the AI Study Companion. Uses **MySQL** for structured app data, **ChromaDB** for vector embeddings and semantic search, and **DeepSeek API** for AI inference (embeddings + LLM generation).

---

## 1. Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Server | FastAPI (Python) | REST API |
| Structured DB | MySQL + SQLAlchemy | Study sets, documents, flashcards, quizzes, notes, chats |
| Vector DB | ChromaDB (local persistent) | Text chunk embeddings + semantic search |
| File Processing | PyMuPDF | PDF text extraction |
| AI Inference | DeepSeek API (OpenAI-compatible) | Embeddings (`deepseek-chat`) + Chat completion |
| Async | aiofiles, aiomysql | Non-blocking file + DB I/O |

---

## 2. Directory Structure

```
server/
├── main.py                     # FastAPI app, CORS, router registration
├── config.py                   # DB URLs, API keys, chunk settings
├── database.py                 # MySQL engine + session factory
├── requirements.txt
│
├── models/                     # SQLAlchemy ORM models
│   ├── __init__.py
│   ├── study_set.py
│   ├── document.py
│   ├── flashcard.py
│   ├── quiz_question.py
│   ├── note.py
│   └── chat_message.py
│
├── routers/                    # API route handlers
│   ├── __init__.py
│   ├── study_sets.py           # CRUD study sets
│   ├── documents.py            # Upload, list, delete documents
│   ├── chat.py                 # Send message → RAG → response
│   ├── flashcards.py           # Generate + list + study flashcards
│   ├── quiz.py                 # Generate + take quizzes
│   ├── summary.py              # Generate document/section summaries
│   └── notes.py                # CRUD notes
│
├── services/                   # Business logic (no HTTP concerns)
│   ├── __init__.py
│   ├── document_service.py     # PDF → extract → chunk → embed → store
│   ├── embedding_service.py    # Call DeepSeek embeddings API
│   ├── retrieval_service.py    # Query ChromaDB, return top-k chunks
│   ├── ai_service.py           # Call DeepSeek chat API with context
│   ├── flashcard_service.py    # LLM-powered flashcard generation
│   ├── quiz_service.py         # LLM-powered MCQ generation
│   └── summary_service.py      # LLM-powered summarization
│
├── chroma/                     # ChromaDB persistent storage (gitignored)
│   └── ...
│
└── uploads/                    # Uploaded PDF files (gitignored)
    └── ...
```

---

## 3. MySQL Schema

### `study_sets`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| title | VARCHAR(255) | |
| subject | VARCHAR(255) | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `documents`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| study_set_id | VARCHAR(36) FK | → study_sets.id |
| filename | VARCHAR(255) | Original filename |
| filepath | VARCHAR(500) | Path in uploads/ |
| chunk_count | INT | Number of chunks stored in ChromaDB |
| uploaded_at | DATETIME | |

### `flashcards`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| study_set_id | VARCHAR(36) FK | |
| question | TEXT | |
| answer | TEXT | |
| explanation | TEXT NULLABLE | |
| mastery | ENUM('unfamiliar','learning','familiar','mastered') | Default: 'unfamiliar' |
| created_at | DATETIME | |

### `quiz_questions`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| study_set_id | VARCHAR(36) FK | |
| question | TEXT | |
| options | JSON | Array of 4 strings |
| correct_index | INT | 0-3 |
| explanation | TEXT | |
| created_at | DATETIME | |

### `notes`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| study_set_id | VARCHAR(36) FK | |
| title | VARCHAR(255) | |
| content | TEXT | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `chat_messages`
| Column | Type | Notes |
|--------|------|-------|
| id | VARCHAR(36) PK | UUID |
| study_set_id | VARCHAR(36) FK | |
| role | ENUM('user','assistant') | |
| content | TEXT | |
| sources | JSON NULLABLE | Array of {filename, page, chunk_text} |
| created_at | DATETIME | |

---

## 4. ChromaDB Collections

One collection per study set, named `set_{study_set_id}`.

Each document stored as:

```json
{
  "id": "{doc_id}_chunk_{i}",
  "text": "Chlorophyll absorbs sunlight mainly in the blue...",
  "embedding": [0.023, -0.451, ...],
  "metadata": {
    "document_id": "abc123",
    "filename": "bio-101.pdf",
    "page": 4,
    "chunk_index": 12,
    "study_set_id": "set-uuid-here"
  }
}
```

---

## 5. RAG Pipeline (Step by Step)

### Upload Flow
```
POST /api/documents/upload
  → Save PDF to server/uploads/
  → Insert row in MySQL documents table
  → PyMuPDF extracts text per page
  → Split into chunks (default: 500 chars, 50 overlap)
  → Call DeepSeek embeddings API for each chunk
  → Store chunks + embeddings in ChromaDB (collection: set_{study_set_id})
  → Update documents.chunk_count in MySQL
  → Return document metadata
```

### Chat Flow
```
POST /api/study-sets/{set_id}/chat
  → Save user message to MySQL chat_messages
  → Call DeepSeek embeddings API for user question
  → Query ChromaDB collection set_{set_id} → top 5 chunks
  → Build prompt: system_prompt + context chunks + user question
  → Call DeepSeek chat API (streaming)
  → Save assistant response + sources to MySQL chat_messages
  → Return response (streamed SSE)
```

### Chunk Settings (config.py)
```python
CHUNK_SIZE = 500       # characters per chunk
CHUNK_OVERLAP = 50     # character overlap between chunks
TOP_K = 5              # chunks to retrieve
```

---

## 6. DeepSeek API Integration

DeepSeek has an OpenAI-compatible API. Use the `openai` Python package pointing to DeepSeek's base URL.

```python
# config.py
DEEPSEEK_API_KEY = "sk-..."
DEEPSEEK_BASE_URL = "https://api.deepseek.com"
DEEPSEEK_CHAT_MODEL = "deepseek-chat"
DEEPSEEK_EMBED_MODEL = "deepseek-chat"  # or their embedding model
```

### Embeddings
```python
from openai import OpenAI
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)

def embed(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model=DEEPSEEK_EMBED_MODEL,
        input=texts
    )
    return [d.embedding for d in response.data]
```

### Chat Completion
```python
def generate(system_prompt: str, context: str, question: str) -> str:
    response = client.chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
        ],
        temperature=0.3,
        stream=True
    )
    # yield chunks for SSE streaming
```

### System Prompt
```
You are a helpful AI study tutor assistant named StudyDash. Answer questions using ONLY the provided context. If the context doesn't contain the answer, say so. Always cite sources by referencing the document filename and page number when available. Be concise and educational.
```

---

## 7. API Endpoints

### Study Sets
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/study-sets` | List all study sets |
| POST | `/api/study-sets` | Create study set |
| GET | `/api/study-sets/{id}` | Get study set with stats |
| DELETE | `/api/study-sets/{id}` | Delete set + cascade |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/study-sets/{set_id}/documents` | Upload PDF |
| GET | `/api/study-sets/{set_id}/documents` | List documents in set |
| DELETE | `/api/documents/{id}` | Delete document + chunks |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/study-sets/{set_id}/chat` | Get chat history |
| POST | `/api/study-sets/{set_id}/chat` | Send message (SSE stream) |

### Flashcards
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/study-sets/{set_id}/flashcards/generate` | Generate flashcards (LLM) |
| GET | `/api/study-sets/{set_id}/flashcards` | List flashcards |
| PATCH | `/api/flashcards/{id}` | Update mastery level |

### Quiz
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/study-sets/{set_id}/quiz/generate` | Generate quiz (LLM) |
| GET | `/api/study-sets/{set_id}/quiz` | Get quiz questions |
| POST | `/api/quiz/submit` | Submit answers, get score |

### Summary
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/study-sets/{set_id}/summary` | Generate summary (LLM) |

### Notes
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/study-sets/{set_id}/notes` | List notes |
| POST | `/api/study-sets/{set_id}/notes` | Create note |
| PATCH | `/api/notes/{id}` | Update note |
| DELETE | `/api/notes/{id}` | Delete note |

---

## 8. Build Order

### Step 1 — Database Foundation
- Install MySQL, create database `studydash`
- Set up SQLAlchemy models + run migrations
- Initialize ChromaDB with persistent directory

### Step 2 — Document Upload Pipeline
- PDF upload endpoint → save to disk
- PyMuPDF text extraction
- Chunking logic
- DeepSeek embedding calls
- Store in ChromaDB + MySQL

### Step 3 — Chat RAG
- Chat endpoint
- Question embedding → ChromaDB search → DeepSeek generation
- SSE streaming response
- Save chat history to MySQL

### Step 4 — Study Tools (LLM-powered)
- Flashcard generation (prompt LLM to produce Q&A pairs from chunks)
- Quiz generation (prompt LLM to produce MCQs)
- Summary generation (prompt LLM to summarize retrieved chunks)

### Step 5 — Notes CRUD
- Standard create/read/update/delete for user notes

---

## 9. Frontend Changes Required

### What to add / wire up

**API layer** — create `src/api.ts` with fetch wrappers for every endpoint above. All calls go to `http://localhost:8000/api/...`.

**State management** — replace all mock data with real API calls:

| Component | Current State | Required Change |
|-----------|--------------|-----------------|
| `Dashboard.tsx` | 5 mock study sets | Fetch `GET /api/study-sets`, map to cards |
| `StudySetView.tsx` | Static mode switch | Real data per mode |
| `ChatView.tsx` | `getResponse()` keyword match | `POST /chat` with SSE streaming, real messages |
| `FlashcardView.tsx` | 5 hardcoded cards | Fetch from API, PATCH mastery on flip |
| `QuizView.tsx` | 5 hardcoded MCQs | Fetch `GET /quiz`, submit answers `POST /quiz/submit` |
| `SummaryView.tsx` | Hardcoded text | Fetch `POST /summary` |
| `NotesView.tsx` | 4 hardcoded notes | Full CRUD against API |
| `Sidebar.tsx` | Static counts | Dynamic counts from API |
| `StudySetSidebar.tsx` | Props only | Real document count + mastery |

**New components needed:**

- `UploadModal.tsx` — drag-and-drop PDF upload with progress bar
- `LoadingSpinner.tsx` — shown during AI generation (flashcards, quiz, summary)

**New dependencies:**

- None strictly required. Use native `fetch` + `EventSource` (or `ReadableStream`) for SSE. Optionally `react-markdown` for rendering rich AI responses.

**How it flows once wired:**

```
User clicks "Import PDF" → UploadModal opens → select file → POST /api/documents
→ progress bar → success → Dashboard refreshes study set card stats

User opens study set → clicks "AI Tutor" → types question → hits send
→ POST /api/chat (SSE stream) → tokens appear one by one in chat bubble
→ typing indicator shown during generation

User clicks "Flashcards" → clicks "Generate" → POST /api/flashcards/generate
→ spinner → cards appear → click to flip → mastery tracked on flip

Same pattern for Quiz (generate → answer → results) and Summary (generate → display)
```

---

## 10. Local Development Setup

```bash
# MySQL
# Install MySQL, create DB:
mysql -u root -e "CREATE DATABASE studydash CHARACTER SET utf8mb4;"

# Python deps
cd server
pip install -r requirements.txt

# Environment variables (.env)
MYSQL_URL=mysql+aiomysql://root:password@localhost:3306/studydash
DEEPSEEK_API_KEY=sk-your-key-here
CHROMA_PERSIST_DIR=./chroma

# Run
uvicorn main:app --reload --port 8000

# Frontend (from project root)
npm run dev
# → http://localhost:5173  (Vite proxied to :8000)
```

Add a Vite proxy to avoid CORS during dev — in `vite.config.ts`:

```ts
server: {
  proxy: {
    '/api': 'http://localhost:8000'
  }
}
```
