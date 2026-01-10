import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from backend.service.project_service import ProjectService
from backend.types.types import EditProjectRequest


@pytest.mark.asyncio
async def test_update_project_success():

    service = ProjectService()

    # -------------------------------
    # mock supabase
    # -------------------------------
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_update_query = MagicMock()

    # mock both eq() and execute()
    mock_update_query.eq.return_value = mock_update_query
    mock_update_query.execute = AsyncMock(return_value=MagicMock(
        data=[{
            "id": "P1",
            "user_id": "U1",
            "name": "Updated Name",
            "description": "Updated Desc",
            "status": "active"
        }]
    ))

    mock_table.update.return_value = mock_update_query
    mock_supabase.table.return_value = mock_table

    # -------------------------------
    # mock redis
    # -------------------------------
    mock_redis = MagicMock()
    mock_redis.delete = AsyncMock()
    mock_redis.setex = AsyncMock()

    # -------------------------------
    # mock rag
    # -------------------------------
    with patch.object(service._rag, "index_project") as mock_rag_index:
        with patch.object(service._rag, "get_project_by_id") as mock_rag_get:
            mock_rag_get.return_value = "UPDATED PROJECT TEXT"

            with patch("backend.service.project_service.get_supabase_client", new=AsyncMock(return_value=mock_supabase)):
                with patch("backend.service.project_service.get_redis_client", new=AsyncMock(return_value=mock_redis)):

                    req = EditProjectRequest(
                        projectId="P1",
                        userId="U1",
                        name="Updated Name",
                        description="Updated Desc"
                    )

                    result = await service.update_project(req)

                    assert result is True

                    # update DB
                    mock_table.update.assert_called_once()

                    # update rag 
                    mock_rag_index.assert_called_once()

                    # update cache
                    mock_redis.delete.assert_awaited_once()
                    mock_redis.setex.assert_awaited_once()