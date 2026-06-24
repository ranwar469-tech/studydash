from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db

from routers.study_sets import router as study_sets_router
from routers.documents import router as documents_router
from routers.chat import router as chat_router
from routers.flashcards import router as flashcards_router
from routers.quiz import router as quiz_router
from routers.summary import router as summary_router
from routers.notes import router as notes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="AI Study Companion API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(study_sets_router)
app.include_router(documents_router)
app.include_router(chat_router)
app.include_router(flashcards_router)
app.include_router(quiz_router)
app.include_router(summary_router)
app.include_router(notes_router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AI Study Companion"}
