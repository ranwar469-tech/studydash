"""Test Study Set CRUD endpoints."""


async def test_create_study_set(client):
    res = await client.post("/api/study-sets", json={
        "title": "Biology 101",
        "subject": "Science",
    })
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Biology 101"
    assert data["subject"] == "Science"
    assert data["document_count"] == 0
    assert "id" in data
    assert "created_at" in data


async def test_create_study_set_default_subject(client):
    res = await client.post("/api/study-sets", json={"title": "No Subject"})
    assert res.status_code == 201
    assert res.json()["subject"] == "General"


async def test_create_study_set_missing_title_rejected(client):
    """Missing required 'title' field should return 422."""
    res = await client.post("/api/study-sets", json={"subject": "Science"})
    assert res.status_code == 422


async def test_list_study_sets_returns_list(client):
    """List endpoint returns a JSON array (may or may not be empty)."""
    res = await client.get("/api/study-sets")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


async def test_list_study_sets_with_data(client):
    # Create test sets
    r1 = await client.post("/api/study-sets", json={"title": "Set A"})
    r2 = await client.post("/api/study-sets", json={"title": "Set B"})
    id_a, id_b = r1.json()["id"], r2.json()["id"]

    res = await client.get("/api/study-sets")
    assert res.status_code == 200
    data = res.json()
    titles = {s["title"] for s in data}
    assert titles >= {"Set A", "Set B"}  # at minimum our two exist

    # Clean up
    await client.delete(f"/api/study-sets/{id_a}")
    await client.delete(f"/api/study-sets/{id_b}")


async def test_get_study_set(client):
    created = await client.post("/api/study-sets", json={"title": "Physics"})
    set_id = created.json()["id"]

    res = await client.get(f"/api/study-sets/{set_id}")
    assert res.status_code == 200
    assert res.json()["title"] == "Physics"


async def test_get_study_set_not_found(client):
    res = await client.get("/api/study-sets/nonexistent-123")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


async def test_update_study_set_title(client):
    created = await client.post("/api/study-sets", json={"title": "Old Title"})
    set_id = created.json()["id"]

    res = await client.patch(f"/api/study-sets/{set_id}", json={"title": "New Title"})
    assert res.status_code == 200
    assert res.json()["title"] == "New Title"
    assert res.json()["subject"] == "General"  # unchanged


async def test_update_study_set_subject(client):
    created = await client.post("/api/study-sets", json={
        "title": "CS", "subject": "STEM",
    })
    set_id = created.json()["id"]

    res = await client.patch(f"/api/study-sets/{set_id}", json={"subject": "Computer Science"})
    assert res.status_code == 200
    assert res.json()["subject"] == "Computer Science"


async def test_delete_study_set(client):
    created = await client.post("/api/study-sets", json={"title": "To Delete"})
    set_id = created.json()["id"]

    res = await client.delete(f"/api/study-sets/{set_id}")
    assert res.status_code == 204

    # Verify it's gone
    res = await client.get(f"/api/study-sets/{set_id}")
    assert res.status_code == 404


async def test_delete_study_set_not_found(client):
    res = await client.delete("/api/study-sets/nonexistent")
    assert res.status_code == 404
