import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from backend.service.task_service import TaskService
from backend.types.types import EditEnrichedTaskRequest


@pytest.mark.asyncio
async def test_update_task_success_with_regeneration():

    service = TaskService()

    # -------------------------------
    # Mock Supabase client
    # -------------------------------
    mock_supabase = MagicMock()
    mock_table = MagicMock()
    mock_update_query = MagicMock()

    # Supabase response with new row
    mock_update_query.execute = AsyncMock(return_value=MagicMock(
        data=[{
            "id": "T123",
            "project_id": "P1",
            "title": "Updated Title",
            "description": "Updated Desc",
            "ai_description": "New AI Desc",
            "story_points": 5,
            "status": "todo",
            "epic": None
        }]
    ))

    mock_update_query.match.return_value = mock_update_query

    # update() must return the query object
    mock_table.update.return_value = mock_update_query

    # table() must return the table object
    mock_supabase.table.return_value = mock_table

    # -------------------------------
    # Mock Redis
    # -------------------------------
    mock_redis = MagicMock()
    mock_redis.get = AsyncMock(return_value='[{"taskId": "T123", "title": "Old Title"}]')
    mock_redis.set = AsyncMock()

    # -------------------------------
    # Mock clients returned by ensure_clients()
    # -------------------------------
    with patch("backend.service.task_service.get_supabase_client", new=AsyncMock(return_value=mock_supabase)) as mock_supabase_factory:
        with patch("backend.service.task_service.get_redis_client", new=AsyncMock(return_value=mock_redis)) as mock_redis_factory:
            mock_supabase_factory.return_value = mock_supabase
            mock_redis_factory.return_value = mock_redis

            # -------------------------------
            # Mock AI regeneration
            # -------------------------------
            with patch("backend.model.model.enrich_edited_task", new_callable=AsyncMock) as mock_enrich:
                mock_enrich.return_value = ("New AI Desc", 5)

                # -------------------------------
                # Mock RAG index_task
                # -------------------------------
                with patch.object(service._rag, "index_task") as mock_rag_index:

                    req = EditEnrichedTaskRequest(
                        taskId="T123",
                        projectId="P1",
                        userId="U1",
                        task_title="Updated Title",
                        user_description="Updated Desc",
                        ai_description=None
                    )

                    result = await service.update_task(req)

                    assert result is True

                    # Check AI regeneration triggered
                    mock_enrich.assert_awaited_once()

                    # Check Supabase called correctly
                    mock_table.update.assert_called_once()

                    # Check RAG indexing triggered
                    mock_rag_index.assert_called_once()

                    # Cache updated
                    mock_redis.set.assert_awaited_once()
