import pytest
import httpx
from unittest.mock import AsyncMock, patch

from backend.main import app


@pytest.mark.asyncio
async def test_delete_project_success():
    payload = {"projectId": "P1", "userId": "U1"}

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.delete_project", new=AsyncMock(return_value=True)) as mock_delete:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/project", json=payload)

    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["data"]["projectId"] == "P1"
    assert "deleted" in data["detail"].lower()
    mock_delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_project_not_found_returns_404():
    payload = {"projectId": "P1", "userId": "U1"}

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.delete_project", new=AsyncMock(return_value=False)) as mock_delete:
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/project", json=payload)

    assert resp.status_code == 404
    mock_delete.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_project_exception_returns_500():
    payload = {"projectId": "P1", "userId": "U1"}

    transport = httpx.ASGITransport(app=app)

    with patch("backend.api.routes._project_service.delete_project", new=AsyncMock(side_effect=Exception("boom"))):
        async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
            resp = await ac.request("DELETE", "/index/delete/project", json=payload)

    assert resp.status_code == 500
    assert "Project deletion failed" in resp.text
