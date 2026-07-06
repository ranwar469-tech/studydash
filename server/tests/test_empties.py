"""Test endpoints that return empty / 404 when no content exists yet."""

import pytest


@pytest.mark.anyio
async def test_chat_history_empty(client):
    ss = await client.post("/api/study-sets", json={"title": "New Set"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/chat")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.anyio
async def test_summary_not_found_when_not_generated(client):
    ss = await client.post("/api/study-sets", json={"title": "No Summary"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/summary")
    assert res.status_code == 404
    assert "no summary" in res.json()["detail"].lower()


@pytest.mark.anyio
async def test_flashcards_list_empty(client):
    ss = await client.post("/api/study-sets", json={"title": "No Cards"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/flashcards")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.anyio
async def test_quiz_list_empty(client):
    ss = await client.post("/api/study-sets", json={"title": "No Quiz"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/quiz")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.anyio
async def test_chat_history_wrong_set(client):
    res = await client.get("/api/study-sets/nonexistent/chat")
    assert res.status_code == 404


@pytest.mark.anyio
async def test_documents_list_empty(client):
    ss = await client.post("/api/study-sets", json={"title": "No Docs"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/documents")
    assert res.status_code == 200
    assert res.json() == []
