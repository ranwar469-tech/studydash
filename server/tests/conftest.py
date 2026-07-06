"""
Shared fixtures for backend API tests.

- Uses a temp directory for SQLite + ChromaDB so real data is untouched.
- Disables rate limiting so tests run fast.
- Cleans DB tables between every test for full isolation.
"""

import os
import shutil
import tempfile

import pytest_asyncio
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture(scope="module")
async def client():
    """Module-scoped client — FastAPI app boots once per test file."""
    tmpdir = tempfile.mkdtemp(prefix="studydash_test_")

    # Point the app at our temp world (use plain sqlite — database.py adds +aiosqlite)
    os.environ["DATABASE_URL"] = f"sqlite:///{tmpdir}/test.db"
    os.environ["CHROMA_PERSIST_DIR"] = f"{tmpdir}/chroma"
    os.environ["UPLOAD_DIR"] = f"{tmpdir}/uploads"
    # Dummy keys so init doesn't crash (no real API calls in these tests)
    os.environ["DEEPSEEK_API_KEY"] = "sk-test-key"
    os.environ["HF_TOKEN"] = "hf-test-token"

    from main import app

    # Disable rate limiting for tests
    app.state.limiter = None

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    shutil.rmtree(tmpdir, ignore_errors=True)


@pytest_asyncio.fixture(autouse=True)
async def clean_db():
    """Drop & recreate all tables before each test."""
    from database import engine, Base

    # Import all models so Base.metadata knows about them
    import models.study_set  # noqa: F401
    import models.document  # noqa: F401
    import models.flashcard  # noqa: F401
    import models.quiz_question  # noqa: F401
    import models.note  # noqa: F401
    import models.chat_message  # noqa: F401
    import models.summary  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield
