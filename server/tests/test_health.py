"""Test health check endpoint."""


async def test_root_health(client):
    res = await client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "AI Study Companion"
