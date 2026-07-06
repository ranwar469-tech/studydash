"""Shared fixtures for backend API tests."""

import os
import shutil
import tempfile

import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture(scope="session")
async def client():
    """Session-scoped client -- file-based temp DB, one app for all tests."""
    tmpdir = tempfile.mkdtemp(prefix="studydash_test_")

    os.environ["DATABASE_URL"] = f"sqlite:///{tmpdir}/test.db"
    os.environ["CHROMA_PERSIST_DIR"] = f"{tmpdir}/chroma"
    os.environ["UPLOAD_DIR"] = f"{tmpdir}/uploads"
    os.environ["DEEPSEEK_API_KEY"] = "sk-test-key"
    os.environ["HF_TOKEN"] = "hf-test-token"

    from main import app

    app.state.limiter = None

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    shutil.rmtree(tmpdir, ignore_errors=True)


@pytest_asyncio.fixture(autouse=True)
async def ensure_tables():
    """Ensure all tables exist before each test (idempotent, no DROP)."""
    from database import engine, Base

    import models.study_set  # noqa: F401
    import models.document  # noqa: F401
    import models.flashcard  # noqa: F401
    import models.quiz_question  # noqa: F401
    import models.note  # noqa: F401
    import models.chat_message  # noqa: F401
    import models.summary  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield
