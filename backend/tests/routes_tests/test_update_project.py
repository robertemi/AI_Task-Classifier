import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.mark.asyncio
async def test_update_project_success_returns_success_true():
    payload = {
        "projectId": "P1",
        "userId": "U1",
        "name": "New Name",
        "description": None
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.update_project", new=AsyncMock(return_value=True)) as mock_update:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put("/index/edit/project", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    mock_update.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_project_fail_returns_success_false():
    payload = {
        "projectId": "P1",
        "userId": "U1",
        "name": "New Name",
        "description": None
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.update_project", new=AsyncMock(return_value=False)) as mock_update:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put("/index/edit/project", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is False
    mock_update.assert_awaited_once()


@pytest.mark.asyncio
async def test_update_project_exception_returns_500():
    payload = {
        "projectId": "P1",
        "userId": "U1",
        "name": "New Name",
        "description": None
    }

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.update_project", new=AsyncMock(side_effect=Exception("boom"))):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.put("/index/edit/project", json=payload)

    assert resp.status_code == 500
    assert "Edit project failed" in resp.text

