# 🎓 StudyDash — AI Study Companion

A full-stack **AI-powered study assistant** that lets students upload course materials (PDFs, DOCX, PPTX, TXT, CSV, MD) and interact with them through a conversational interface powered by **Retrieval-Augmented Generation (RAG)**. Includes summarization, flashcard generation, adaptive quiz creation, and OCR for scanned documents.

<p align="center">
  <img src="https://img.shields.io/badge/backend-FastAPI-009688?logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/frontend-React-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/AI-DeepSeek%20%2B%20Qwen3-8B-blueviolet" alt="AI">
  <img src="https://img.shields.io/badge/database-SQLite%20%2B%20ChromaDB-003B57" alt="Database">
  <img src="https://img.shields.io/badge/tests-79%20passing-brightgreen" alt="Tests">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## ✨ Features

### 📄 Document Processing
- Upload **PDF, DOCX, PPTX, TXT, CSV, MD** files
- Automatic text extraction with **OCR fallback** (Tesseract) for scanned PDFs
- Smart chunking with LangChain's `RecursiveCharacterTextSplitter`
- Vector embeddings via **Qwen3-Embedding-8B** (HuggingFace Inference API)

### 💬 RAG Chatbot
- Ask questions about your documents with **source citations** `[1] [3]`
- Clickable citations open a built-in **PDF viewer** at the exact cited page
- **Real-time SSE token streaming** from DeepSeek API
- **Multi-turn conversation memory** (last 3 exchanges)
- Intelligent retrieval: semantic search for specific queries, full-document retrieval for summaries/overviews

### 🎯 Study Modes
| Mode | Behavior |
|------|----------|
| **Standard** | Balanced, educational responses with examples |
| **ELI5** | Simple analogies, no jargon, playful examples |
| **Deep Dive** | Graduate-level analysis, tradeoffs, historical context |

### 📝 Study Tools
| Tool | Description |
|------|-------------|
| **Summarization** | Map-reduce pipeline covering 100% of document content |
| **Flashcards** | AI-generated Q&A pairs with configurable count (5/8/12) |
| **Quiz** | Multiple-choice questions with plausible distractors + explanations |

### 🛠️ DevOps & Quality
- **Docker** with multi-stage builds (97% smaller frontend image)
- **Docker Compose** with health checks, persistent volumes, Nginx reverse proxy
- **CI/CD** via GitHub Actions: lint → type-check → 79 automated tests → Docker build
- **Rate limiting** with tiered limits per endpoint (AI-heavy: 3/min, reads: 60/min)
- **Async I/O** throughout: `asyncpg`-style SQLAlchemy + FastAPI async endpoints

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)              │
│  Dashboard │ ChatView │ Flashcards │ Quiz │ Summary      │
│  TailwindCSS │ react-markdown │ react-pdf                │
└──────────────────────┬───────────────────────────────────┘
                       │ SSE / REST
                       ▼
┌──────────────────────────────────────────────────────────┐
│                   Nginx (Docker only)                     │
│  SPA fallback │ /api proxy │ SSE unbuffered              │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│                  Backend (FastAPI + Uvicorn)              │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────────┐  │
│  │ Routers  │  │ Services │  │ AI Layer               │  │
│  │          │  │          │  │  • DeepSeek Chat API    │  │
│  │ study    │  │ ai       │  │  • Qwen3-Embedding-8B   │  │
│  │ documents│  │ retrieval│  │  • Structured JSON out  │  │
│  │ chat     │  │ document │  └───────────────────────┘  │
│  │ flashcards│ │ flashcard│                             │
│  │ quiz     │  │ quiz     │  ┌───────────────────────┐  │
│  │ summary  │  │ summary  │  │ Storage               │  │
│  │ notes    │  │ embedding│  │  • SQLite (async)      │  │
│  └──────────┘  └──────────┘  │  • ChromaDB (vectors)  │  │
│                               └───────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS v4 |
| **Backend** | FastAPI, Uvicorn, Python 3.12+ |
| **Database** | SQLite (async via aiosqlite + SQLAlchemy 2.0) |
| **Vector Store** | ChromaDB (persistent, HuggingFace embeddings) |
| **AI / LLM** | DeepSeek Chat API, Qwen3-Embedding-8B (HuggingFace Inference) |
| **File Processing** | PyMuPDF, python-docx, python-pptx, Tesseract OCR |
| **Chunking** | LangChain RecursiveCharacterTextSplitter |
| **Rate Limiting** | slowapi (per-endpoint tiered limits) |
| **Testing** | pytest + pytest-asyncio (backend), Vitest + Testing Library (frontend) |
| **DevOps** | Docker multi-stage, Docker Compose, GitHub Actions CI, Nginx |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.12+** with `pip`
- **Node.js 22+** with `npm`
- **Tesseract OCR** (optional, for scanned PDFs)
- **DeepSeek API key** ([get one here](https://platform.deepseek.com))
- **HuggingFace token** ([get one here](https://huggingface.co/settings/tokens))

### 1. Clone & Configure

```bash
git clone https://github.com/ranwar469-tech/studydash.git
cd studydash

# Backend: create .env from example
cp server/.env.example server/.env
# Edit server/.env — add your DEEPSEEK_API_KEY and HF_TOKEN
```

### 2. Backend Setup

```bash
cd server
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API runs at **http://localhost:8000**

### 3. Frontend Setup

```bash
# From project root
npm install
npm run dev
```

App runs at **http://localhost:5173**

---

## 🐳 Docker (Production)

```bash
# Build & start everything
docker compose up --build

# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

The Docker setup uses **multi-stage builds**:
- **Frontend**: `node:22-alpine` build → `nginx:alpine` serve (22 MB final image, 97% reduction)
- **Backend**: build stage with dev tools → slim runtime with only venv (550 MB final image)

---

## 🧪 Testing

```bash
# Frontend (54 tests)
npm test

# Backend (25 tests)
cd server
pytest tests/ -v
```

| Suite | Tests | Runtime | Framework |
|-------|:-----:|:-------:|-----------|
| Frontend | 54 | ~6s | Vitest + Testing Library |
| Backend | 25 | ~4s | pytest + httpx |
| **Total** | **79** | **~10s** | |

---

## 🔄 CI/CD Pipeline

Every push to `main` triggers:

```
backend job          frontend job
├─ Syntax check      ├─ TypeScript type-check
├─ pytest (25 tests) ├─ Vitest (54 tests)
│                    └─ Production build
         │              │
         └──────┬───────┘
                ▼
         docker job
         ├─ Build backend image
         ├─ Build frontend image
         └─ Verify compose config
```

---

## 📡 API Endpoints

### Study Sets
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/study-sets` | List all study sets |
| `POST` | `/api/study-sets` | Create a study set |
| `GET` | `/api/study-sets/{id}` | Get study set details |
| `PATCH` | `/api/study-sets/{id}` | Rename title / subject |
| `DELETE` | `/api/study-sets/{id}` | Delete set + files + vectors |

### Documents
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/study-sets/{id}/documents` | Upload file (multipart) |
| `GET` | `/api/study-sets/{id}/documents` | List documents in set |
| `GET` | `/api/documents/{id}/file` | Serve raw file (PDF viewer) |
| `DELETE` | `/api/documents/{id}` | Delete document + chunks |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/study-sets/{id}/chat` | Chat history |
| `POST` | `/api/study-sets/{id}/chat` | Send message (SSE stream) |

### Study Tools
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/study-sets/{id}/summary` | Get saved summary |
| `POST` | `/api/study-sets/{id}/summary` | Generate summary |
| `GET` | `/api/study-sets/{id}/flashcards` | List flashcards |
| `POST` | `/api/study-sets/{id}/flashcards/generate` | Generate flashcards |
| `PATCH` | `/api/flashcards/{id}` | Update mastery |
| `GET` | `/api/study-sets/{id}/quiz` | List quiz questions |
| `POST` | `/api/study-sets/{id}/quiz/generate` | Generate quiz |
| `POST` | `/api/study-sets/{id}/quiz/submit` | Submit answers |

### Notes
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/study-sets/{id}/notes` | List notes |
| `POST` | `/api/study-sets/{id}/notes` | Create note |
| `PATCH` | `/api/notes/{id}` | Update note |
| `DELETE` | `/api/notes/{id}` | Delete note |

### Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check (Docker healthcheck) |

---

## 🔐 Rate Limits

| Tier | Limit | Endpoints |
|------|:-----:|-----------|
| AI-Heavy | 3/min | Summary generation |
| AI-Medium | 5/min | Flashcard & quiz generation |
| AI-Light | 10/min | Chat send, document upload |
| Write | 15/min | Delete operations |
| Submit | 20/min | Quiz submission |
| CRUD | 30/min | Study sets, notes, flashcards list |
| Read | 60/min | Chat history, document list, PDF serve |

Exceeded limits return `429` with `{"detail": "Rate limit exceeded. ..."}`.

---

## 🌍 Environment Variables

All config lives in `server/.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite:///./studydash.db` | SQLite path |
| `CHROMA_PERSIST_DIR` | `./chroma` | Vector store directory |
| `DEEPSEEK_API_KEY` | — | DeepSeek API key (**required**) |
| `DEEPSEEK_BASE_URL` | `https://api.deepseek.com` | DeepSeek endpoint |
| `DEEPSEEK_CHAT_MODEL` | `deepseek-chat` | Model name |
| `HF_TOKEN` | — | HuggingFace token (**required**) |
| `HF_EMBED_MODEL` | `Qwen/Qwen3-Embedding-8B` | Embedding model |
| `CHUNK_SIZE` | `600` | Text chunk size |
| `CHUNK_OVERLAP` | `100` | Chunk overlap |
| `TOP_K` | `5` | Semantic search results |
| `UPLOAD_DIR` | `./uploads` | Upload storage |
| `OCR_ENABLED` | `true` | OCR for scanned PDFs |
| `OCR_LANGUAGE` | `eng` | Tesseract language(s) |
| `OCR_DPI` | `300` | OCR resolution |
| `OCR_MIN_TEXT_LENGTH` | `50` | Trigger OCR below this |

---

## 📁 Project Structure

```
studydash/
├── src/                          # Frontend (React + Vite)
│   ├── components/               # 15 React components
│   │   ├── ChatView.tsx          # SSE streaming chat
│   │   ├── Dashboard.tsx         # Study set grid + filters
│   │   ├── FlashcardView.tsx     # Flashcard flip cards
│   │   ├── QuizView.tsx          # MCQ quiz interface
│   │   ├── SummaryView.tsx       # AI summary display
│   │   ├── DocumentsView.tsx     # PDF viewer + file list
│   │   ├── UploadModal.tsx       # File upload with progress
│   │   └── ...                   # Sidebar, modals, spinners
│   ├── __tests__/                # 54 frontend tests (Vitest)
│   ├── api.ts                    # API client (typed fetch wrapper)
│   ├── types.ts                  # TypeScript interfaces
│   └── main.tsx                  # Entry point
│
├── server/                       # Backend (FastAPI)
│   ├── routers/                  # 7 route modules
│   │   ├── chat.py               # SSE streaming, history, retrieval
│   │   ├── documents.py          # Upload, list, serve, delete
│   │   ├── flashcards.py         # Generate, list, mastery
│   │   ├── quiz.py               # Generate, list, submit
│   │   ├── summary.py            # Generate, fetch
│   │   ├── study_sets.py         # CRUD + rename
│   │   └── notes.py              # CRUD
│   ├── services/                 # Business logic
│   │   ├── ai_service.py         # DeepSeek API (chat, stream, structured)
│   │   ├── retrieval_service.py  # ChromaDB queries (semantic + full)
│   │   ├── embedding_service.py  # HuggingFace inference
│   │   ├── document_service.py   # PDF/DOCX/PPTX/TXT/CSV extractors
│   │   ├── flashcard_service.py  # AI flashcard generation
│   │   ├── quiz_service.py       # AI quiz generation
│   │   └── summary_service.py    # Map-reduce summarization
│   ├── models/                   # SQLAlchemy models (7 tables)
│   ├── tests/                    # 25 backend tests (pytest)
│   ├── config.py                 # Environment config
│   ├── database.py               # Async SQLAlchemy engine + session
│   ├── limiter.py                # Rate limiter (slowapi)
│   ├── schemas.py                # Pydantic request/response models
│   ├── main.py                   # FastAPI app entry point
│   └── Dockerfile                # Multi-stage Python build
│
├── .github/workflows/ci.yml      # CI pipeline
├── docker-compose.yml            # Docker orchestration
├── Dockerfile                    # Frontend multi-stage build
├── nginx.conf                    # Nginx config (SPA + API proxy)
├── .dockerignore                 # Docker exclusions
└── package.json                  # Frontend dependencies
```

---

## 📝 License

MIT — feel free to use, modify, and share.

---

## 🙏 Acknowledgements

- [DeepSeek](https://deepseek.com) for the chat API
- [Qwen](https://huggingface.co/Qwen) for the embedding model
- [ChromaDB](https://trychroma.com) for the vector database
- [LangChain](https://langchain.com) for text splitting
