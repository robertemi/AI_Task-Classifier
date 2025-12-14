import pytest
from unittest.mock import MagicMock, AsyncMock, patch

from backend.service.project_service import ProjectService
from backend.types.types import DeleteProjectRequest


@pytest.mark.asyncio
async def test_delete_project_success():

    service = ProjectService()

    # -------------------------------
    # mock supabase
    # -------------------------------
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_delete_query = MagicMock()

    mock_delete_query.match.return_value = mock_delete_query
    mock_delete_query.execute = AsyncMock(return_value=MagicMock(data=[{"id": "P1"}]))

    mock_table.delete.return_value = mock_delete_query
    mock_supabase.table.return_value = mock_table

    # -------------------------------
    # mock redis
    # -------------------------------
    mock_redis = MagicMock()
    mock_redis.delete = AsyncMock()

    # -------------------------------
    # mock delete_project from rag
    # -------------------------------
    with patch.object(service._rag, "delete_project") as mock_rag_delete:

        with patch("backend.service.project_service.get_supabase_client", new=AsyncMock(return_value=mock_supabase)):
            with patch("backend.service.project_service.get_redis_client", new=AsyncMock(return_value=mock_redis)):

                req = DeleteProjectRequest(
                    projectId="P1",
                    userId="U1"
                )

                result = await service.delete_project(req)

                assert result is True

                # delete from supabase
                mock_table.delete.assert_called_once()

                # delete from RAG
                mock_rag_delete.assert_called_once_with("P1")

                # delete from cache
                mock_redis.delete.assert_awaited_once()
