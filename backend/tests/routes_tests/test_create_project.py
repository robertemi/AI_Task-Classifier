import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.mark.asyncio
async def test_route_create_project_success():
    payload = {
        "projectId": None,
        "userId": "U1",
        "name": "Test Project",
        "description": "Test Desc",
        "status": "active",
    }

    transport = httpx.ASGITransport(app=app)

    with patch(
        "backend.api.routes._project_service.create_project",
        new=AsyncMock(return_value={"id": "P999"}),
    ) as mock_create:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/project", json=payload)

    assert resp.status_code == 200
    data = resp.json()

    assert data["succes"] is True
    assert data["message"] == {"id": "P999"}

    mock_create.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_create_project_fail_returns_succes_false():
    payload = {
        "projectId": None,
        "userId": "U1",
        "name": "Test Project",
        "description": "Test Desc",
        "status": "active",
    }

    transport = httpx.ASGITransport(app=app)

    with patch(
        "backend.api.routes._project_service.create_project",
        new=AsyncMock(return_value=None),
    ) as mock_create:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/project", json=payload)

    assert resp.status_code == 200
    data = resp.json()

    assert data["succes"] is False
    assert data["message"] is None

    mock_create.assert_awaited_once()


@pytest.mark.asyncio
async def test_route_create_project_exception_returns_500():
    payload = {
        "projectId": None,
        "userId": "U1",
        "name": "Test Project",
        "description": "Test Desc",
        "status": "active",
    }

    transport = httpx.ASGITransport(app=app)

    with patch(
        "backend.api.routes._project_service.create_project",
        new=AsyncMock(side_effect=Exception("boom")),
    ):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.post("/index/project", json=payload)

    assert resp.status_code == 500
    assert "Project creation failed" in resp.text
