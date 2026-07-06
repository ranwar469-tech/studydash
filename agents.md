# AI Study Companion (RAG Chatbot) — Simple Development Phases

## Overview

A study assistant chatbot that lets students upload course materials and ask questions, generate summaries, flashcards, and quizzes using Retrieval-Augmented Generation (RAG).

---

# Phase 1 — Basic RAG Chatbot (Core MVP)

## Goal

Build a working chatbot that can answer questions from uploaded documents.

## Features

### Document Upload

* Upload PDF files (start simple)
* Extract text from documents
* Split text into chunks

### RAG Pipeline

* Create embeddings for chunks
* Store in vector database (ChromaDB or Qdrant)
* Retrieve relevant chunks based on user query

### Chatbot

* Ask questions about uploaded documents
* Get answers grounded in retrieved context
* Show sources (basic citations)

## Output

* “Chat with your PDF” functionality
* Course-specific Q&A

---

# Phase 2 — Study Enhancements

## Goal

Make it useful for real studying, not just Q&A.

## Features

### Summarization

* Summarize full document
* Summarize specific topics or sections

### Flashcards Generator

* Auto-generate Q&A flashcards from notes
* Save flashcards per document

### Simple Quiz Generator

* Generate MCQs from content
* Show correct answers + explanation

## Output

* Study tools added on top of chatbot
* Users can revise faster

---

# Phase 3 — Smart Study Experience

## Goal

Make it feel like a real AI study assistant.

## Features

### Study Modes

* “Explain like I’m a beginner”
* “Exam revision mode”
* “Quick summary mode”

### Improved Retrieval

* Better chunking (section-aware)
* Better context selection (top-k tuning)

### Chat History

* Store previous questions per document
* Allow follow-up questions

## Output

* More natural tutoring experience
* Better answer quality

---

# Phase 4 — Polish + CV Features

## Goal

Make it impressive for recruiters.

## Features

### UI Improvements

* Clean dashboard (courses + documents)
* Chat interface (like ChatGPT style)
* Sidebar for flashcards/quizzes

### System Improvements

* Source highlighting (clickable citations)
* Loading states + streaming responses

### Optional (if time)

* Multiple documents per course
* Delete/manage uploads

## Output

* Fully presentable SaaS-style app

---

# Final Result

By the end, you will have:

* RAG chatbot over PDFs
* Summarization tool
* Flashcard generator
* Quiz generator
* Study modes
* Clean full-stack UI

---

# Tech Stack (Simple & Realistic)

## Frontend

* React (Vite)
* TailwindCSS

## Backend

* FastAPI or Node.js

## AI Layer

* OpenAI / Gemini API
* LangChain (optional but helpful)

## Storage

* ChromaDB (simple local vector DB)

## File Processing

* PyMuPDF / pdfplumber

---

# CV Summary Version

> Built an AI-powered Study Companion using Retrieval-Augmented Generation (RAG), enabling students to upload lecture notes and interact with them through a conversational interface. Implemented document chunking, embedding-based semantic search, and LLM-powered responses with citations, along with study tools including summarization, flashcard generation, and quiz creation.

---

# 📋 Detailed Improvement Checklist

## Legend

| Icon | Meaning |
|------|---------|
| 🔴 | Critical — broken or severely degraded |
| 🟠 | High — major quality / UX improvement |
| 🟡 | Medium — nice-to-have feature |
| 🟢 | Low — polish / future consideration |
| ⚡ | Quick win (≤ 1 hour) |
| 🐢 | Large effort (2+ days) |

---

## 🔴 CRITICAL FIXES (Do First)

- [x] **🔴⚡ Fix duplicate `import json`** — `server/routers/quiz.py` had `import json` on both lines 1 and 2. Removed the duplicate. ✅
  - **Files:** `server/routers/quiz.py`

- [x] **🔴⚡ Wire true SSE token streaming** — `ai_service.py` already had `stream_chat()` (async generator yielding tokens from DeepSeek in real time). Swapped chat router from sync `chat_completion()` + fake char-by-char streaming to real async token streaming via `stream_chat()`. ✅
  - **Files:** `server/routers/chat.py`, `server/services/ai_service.py`

- [x] **🔴⚡ Save assistant message BEFORE streaming** — ChatMessage placeholder row is now inserted before the stream starts, then updated with full content after completion. If server crashes mid-stream, partial response is preserved. ✅
  - **Files:** `server/routers/chat.py`

- [ ] **🔴⚡ Remove unused `DEEPSEEK_EMBED_MODEL` config** — `config.py` defines `DEEPSEEK_EMBED_MODEL` but embeddings actually use `HF_EMBED_MODEL` (Qwen3-Embedding-8B via HuggingFace Inference API).

- [ ] **🔴🐢 Fix DB session leaks in services** — `flashcard_service.py`, `quiz_service.py`, and `summary_service.py` create their own `SessionLocal()` instances directly instead of using FastAPI's dependency injection.

- [ ] **🔴⚡ Add startup environment validation** — On `main.py` startup, validate that `DEEPSEEK_API_KEY` and `HF_TOKEN` are set and APIs reachable.

---

## 🟠 RAG PIPELINE ENHANCEMENTS

- [x] **🟠⚡ Intent-aware retrieval** — Chat router detects broad questions ("summarize", "list topics", "overview") and switches from `retrieve_chunks()` (top-5 semantic) to `get_all_chunks()` (comprehensive, page-ordered). ✅

- [x] **🟠⚡ Map-reduce summarization** — Summary service gets ALL chunks (no semantic filter), splits into batches of 15, summarizes each batch, then merges into final summary. Ensures 100% document coverage. ✅

- [ ] **🟠🐢 Add re-ranking of retrieved chunks** — Retrieve top-10 chunks, pass through cross-encoder re-ranker, keep top 3-4.

- [ ] **🟠🐢 Implement hybrid search (keyword + semantic)** — BM25 + vector with Reciprocal Rank Fusion.

- [ ] **🟠🐢 Add query expansion / HyDE** — LLM generates hypothetical answer, embed that for retrieval.

- [ ] **🟠🐢 Implement semantic chunking** — Replace RecursiveCharacterTextSplitter with LangChain's SemanticChunker.

- [ ] **🟠⚡ Multi-query retrieval** — Generate 3-4 question variations, retrieve for each, union results.

- [ ] **🟠🐢 Parent Document Retriever (small-to-big)** — Store small chunks, return larger surrounding context.

- [ ] **🟠⚡ Metadata filtering improvements** — Add filters for `page_range`, `date_range`, `document_type`.

---

## 🟡 LLM & GENERATION IMPROVEMENTS

- [x] **🟡🐢 Multi-turn conversation memory** — Chat router fetches last 6 messages (3 exchanges) from DB, passes as conversation history to stream_chat(). ✅
  - **Files:** `server/routers/chat.py`, `server/services/ai_service.py`

- [x] **🟡🐢 Study modes** — 3 modes: **Standard**, **ELIF (Explain Like I'm Five)**, **Deep Dive Analysis**. Mode-specific system prompts with different tone/depth. Dropdown selector in chat header. ✅
  - **Files:** `server/services/ai_service.py` (MODE_PROMPTS), `server/routers/chat.py`, `server/schemas.py`, `src/components/ChatView.tsx`, `src/types.ts`

- [x] **🟡🐢 Structured JSON output** — Added `structured_completion()` + `stream_structured_completion()` using dedicated system+user prompt pattern. Flashcard/quiz/summary services use it instead of fragile `json.loads()` + code fence stripping. ✅
  - **Files:** `server/services/ai_service.py`, all generation services

- [x] **🟡⚡ Source-aware generation with chunk IDs** — Chunks labeled `[Chunk 1]`, `[Chunk 2]` in context. System prompt asks LLM to cite with `[1]`, `[3]`. Sources display matching `[1]`, `[2]` numbers next to filename. ✅
  - **Files:** `server/services/ai_service.py`, `server/routers/chat.py`, `src/components/ChatView.tsx`

- [x] **🟡⚡ Better prompt engineering** — Flashcards: conceptual Qs ("Why...", "Compare..."), varied difficulty. Quizzes: plausible distractors, scenario-based Qs. Summaries: standalone insights, logical sections. ✅
  - **Files:** `server/services/flashcard_service.py`, `quiz_service.py`, `summary_service.py`

- [x] **🟡⚡ Less strict context policy** — SYSTEM_PROMPT allows supplementing from own knowledge when context is thin, with transparency about what comes from docs vs. general knowledge. ✅
  - **Files:** `server/services/ai_service.py`

- [ ] **🟡⚡ Streaming for summaries, flashcards, and quizzes** — Still synchronous.

---

## 🟢 NEW FEATURES

- [x] **🟢🐢 Multi-format document support** — Supports PDF, DOCX, PPTX, TXT, MD, CSV. Each format has dedicated extractor. ✅
  - **Files:** `server/services/document_service.py` (5 extractors + dispatch dict), `server/routers/documents.py`, `server/requirements.txt`, `src/components/UploadModal.tsx`

- [x] **🟢🐢 OCR integration** — PDF pages with <50 chars native text auto-fallback to Tesseract OCR via PyMuPDF. Configurable via env vars. OCR badge shown on documents. ✅
  - **Files:** `server/services/document_service.py`, `server/config.py`, `server/models/document.py`, `server/schemas.py`, `src/components/DocumentsView.tsx`

- [x] **🟢⚡ Flashcard count selector** — Dropdown for Low (5), Medium (8), High (12) cards. Shown on both initial Generate and Regenerate. ✅
  - **Files:** `server/routers/flashcards.py`, `server/services/flashcard_service.py`, `src/api.ts`, `src/components/FlashcardView.tsx`

- [x] **🟢⚡ Study set rename** — Click title or subject in sidebar to inline-edit. Enter saves, Escape cancels. PATCH endpoint updates DB. ✅
  - **Files:** `server/routers/study_sets.py`, `server/schemas.py`, `src/api.ts`, `src/components/StudySetSidebar.tsx`, `src/components/StudySetView.tsx`

- [x] **🔵⚡ Category filters on dashboard** — Filter pills for each unique subject appear above study set grid. Click to filter, click again to clear. ✅
  - **Files:** `src/components/Dashboard.tsx`

- [x] **🔵⚡ Upload format badges** — Color-coded badges show supported formats in upload modal (PDF=red, DOCX=blue, PPTX=orange, etc.). ✅
  - **Files:** `src/components/UploadModal.tsx`

- [x] **🔵⚡ Source deduplication + clickable PDF viewer** — Sources deduplicated by (filename, page). Clicking a source opens PDF viewer at that exact page. Expand/collapse for >3 sources. ✅
  - **Files:** `server/routers/chat.py`, `src/components/ChatView.tsx`, `src/types.ts`

- [x] **🔵🐢 Built-in PDF viewer** — Documents page: click any doc → modal with react-pdf viewer, page navigation. Sources in chat: click citation → modal at exact page. ✅
  - **Files:** `src/components/DocumentsView.tsx`, `src/components/ChatView.tsx`, `server/routers/documents.py`

- [ ] **🟢🐢 Spaced repetition for flashcards (SM-2 algorithm)**

- [ ] **🟢🐢 YouTube video transcript ingestion**

- [ ] **🟢🐢 Concept maps / knowledge graph**

- [ ] **🟢⚡ Audio read-aloud (TTS)**

- [ ] **🟢🐢 Export functionality (Anki / PDF / CSV)**

- [ ] **🟢🐢 Document comparison**

- [ ] **🟢🐢 Collaborative study sets**

---

## 🔵 UI / UX POLISH

- [x] **🔵⚡ Clickable source citations** — Sources are clickable buttons. Clicking opens PDF viewer at the cited page. ✅
- [ ] **🔵⚡ Streaming cursor animation**
- [ ] **🔵⚡ Dark / Light theme toggle**
- [ ] **🔵⚡ Keyboard shortcuts**
- [ ] **🔵🐢 Progressive Web App (PWA)**
- [ ] **🔵⚡ Message actions (copy, regenerate, thumbs up/down)**
- [ ] **🔵⚡ Markdown rendering enhancements (LaTeX, syntax highlighting)**
- [ ] **🔵⚡ Mobile responsive layout**
- [ ] **🔵⚡ Toast notifications**

---

## 🟣 ENGINEERING & DEVOPS

- [x] **🟣⚡ Input validation hardening** — File type validation uses extension whitelist from `SUPPORTED_EXTENSIONS`. Failed uploads clean up orphaned files and DB rows. ✅
- [x] **🟣⚡ Delete study set cleans up files** — `delete_study_set` now removes physical PDFs from disk before deleting DB rows. ✅
- [ ] **🟣🐢 Async database & HTTP throughout**
- [ ] **🟣⚡ Add caching layer**
- [ ] **🟣⚡ Comprehensive error handling middleware**
- [ ] **🟣🐢 Testing suite**
- [ ] **🟣🐢 Rate limiting**
- [ ] **🟣🐢 Docker + Docker Compose**
- [ ] **🟣⚡ Logging**
- [ ] **🟣⚡ CORS hardening**
- [ ] **🟣⚡ `.env.example` file**

---

## 📊 Summary Statistics

| Category | Done | Remaining |
|----------|:----:|:---------:|
| 🔴 Critical Fixes | 3 | 3 |
| 🟠 RAG Enhancements | 2 | 7 |
| 🟡 LLM Improvements | 6 | 1 |
| 🟢 New Features | 7 | 7 |
| 🔵 UI/UX Polish | 1 | 8 |
| 🟣 Engineering/DevOps | 2 | 8 |
| **TOTAL** | **21** | **34** |

---

## 🏆 Suggested Sprint Plan

### ✅ Sprint 1: Crunch Time (COMPLETED)
1. ✅ Fix duplicate import
2. ✅ Wire true SSE streaming
3. ✅ Save assistant message before streaming
4. ✅ Multi-turn conversation memory
5. ✅ Study modes (Standard / ELIF / Deep Dive)
6. ✅ Structured JSON output for flashcards/quizzes/summaries
7. ✅ Source-aware generation with chunk IDs
8. ✅ Better prompt engineering
9. ✅ Less strict context policy (can supplement from own knowledge)

### ✅ Sprint 2: Study Tools Upgrade (COMPLETED)
10. ✅ Map-reduce summarization (full document coverage)
11. ✅ Intent-aware retrieval (broad vs. targeted questions)
12. ✅ Clickable source citations → opens PDF at cited page
13. ✅ Built-in PDF viewer (Documents page + Chat sources)
14. ✅ Multi-format document support (PDF, DOCX, PPTX, TXT, CSV, MD)
15. ✅ OCR integration (Tesseract fallback for scanned PDFs)
16. ✅ Flashcard count selector (Low 5 / Medium 8 / High 12)
17. ✅ Study set rename (inline-edit title + subject)
18. ✅ Category filters on dashboard
19. ✅ Upload format badges

### Sprint 3: Engineering & Polish (Days 1-4)
20. Docker + Docker Compose
21. Testing suite (pytest)
22. Keyboard shortcuts
23. Toast notifications
24. Message actions (copy, regenerate)
25. Remove unused config + startup env validation
26. `.env.example` file

### Sprint 4: RAG Quality (Days 5-8)
27. Re-ranking of retrieved chunks
28. Hybrid search (BM25 + vector)
29. Semantic chunking
30. Streaming for flashcards/quizzes/summaries

### Sprint 5: Stretch Goals (Days 9-12)
31. Spaced repetition for flashcards (SM-2)
32. Audio read-aloud (TTS)
33. Dark/light theme toggle
34. Mobile responsive layout
35. PWA support
36. Export to Anki / PDF / CSV

---

## 🎯 CV Version (Updated)

> Built an AI-powered Study Companion using **Retrieval-Augmented Generation (RAG)**, enabling students to upload lecture notes (PDF, DOCX, PPTX, TXT, CSV, MD) and interact with them through a conversational interface. Implemented **document chunking**, **embedding-based semantic search** (Qwen3-8B via HuggingFace), **token-level SSE streaming**, and **LLM-powered responses with clickable source citations** that open a built-in PDF viewer at the exact cited page. Built study tools including **map-reduce AI summarization**, **flashcard generation** with configurable counts, **adaptive MCQ quiz creation**, and **OCR fallback** for scanned documents. Features multi-turn conversation memory, three study modes (Standard / ELIF / Deep Dive), and intent-aware dual retrieval strategy.

---

If you want next, I can also:

* design the **database schema**
* design the **API routes**
* or give you a **step-by-step build order (day-by-day plan)**
