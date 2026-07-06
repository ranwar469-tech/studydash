"""Test Notes CRUD endpoints."""

import pytest


@pytest.mark.anyio
async def test_create_note(client):
    # Need a study set first
    ss = await client.post("/api/study-sets", json={"title": "CS Notes"})
    set_id = ss.json()["id"]

    res = await client.post(f"/api/study-sets/{set_id}/notes", json={
        "title": "Week 1: Trees",
        "content": "Binary trees, BSTs, AVL rotations.",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Week 1: Trees"
    assert data["content"] == "Binary trees, BSTs, AVL rotations."
    assert data["study_set_id"] == set_id
    assert "id" in data


@pytest.mark.anyio
async def test_create_note_missing_set(client):
    res = await client.post("/api/study-sets/nonexistent/notes", json={
        "title": "Nope", "content": "Will fail",
    })
    assert res.status_code == 404


@pytest.mark.anyio
async def test_list_notes_empty(client):
    ss = await client.post("/api/study-sets", json={"title": "Empty"})
    set_id = ss.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}/notes")
    assert res.status_code == 200
    assert res.json() == []


@pytest.mark.anyio
async def test_list_notes(client):
    ss = await client.post("/api/study-sets", json={"title": "Chemistry"})
    set_id = ss.json()["id"]

    await client.post(f"/api/study-sets/{set_id}/notes", json={
        "title": "A", "content": "First",
    })
    await client.post(f"/api/study-sets/{set_id}/notes", json={
        "title": "B", "content": "Second",
    })

    res = await client.get(f"/api/study-sets/{set_id}/notes")
    assert res.status_code == 200
    assert len(res.json()) == 2


@pytest.mark.anyio
async def test_update_note(client):
    ss = await client.post("/api/study-sets", json={"title": "Math"})
    set_id = ss.json()["id"]

    created = await client.post(f"/api/study-sets/{set_id}/notes", json={
        "title": "Calculus", "content": "Derivatives.",
    })
    note_id = created.json()["id"]

    res = await client.patch(f"/api/notes/{note_id}", json={
        "title": "Calculus I", "content": "Limits & derivatives.",
    })
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == "Calculus I"
    assert data["content"] == "Limits & derivatives."


@pytest.mark.anyio
async def test_delete_note(client):
    ss = await client.post("/api/study-sets", json={"title": "History"})
    set_id = ss.json()["id"]

    created = await client.post(f"/api/study-sets/{set_id}/notes", json={
        "title": "WW2", "content": "1939-1945",
    })
    note_id = created.json()["id"]

    res = await client.delete(f"/api/notes/{note_id}")
    assert res.status_code == 204

    # List should be empty now
    res = await client.get(f"/api/study-sets/{set_id}/notes")
    assert res.json() == []


@pytest.mark.anyio
async def test_delete_note_not_found(client):
    res = await client.delete("/api/notes/nonexistent")
    assert res.status_code == 404
