import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock

from backend.model.model import enrich_task_details
from backend.types.types import IndexTaskRequest

from backend.service.task_service import TaskService

@pytest.mark.asyncio
async def test_enrich_task_details_success():

    # --------------------------
    # mock input request
    # --------------------------
    req = IndexTaskRequest(
        userId="u999",
        projectId="p123",
        task_title="Create login page",
        user_description="User wants a login page",
        selected_model="1"
    )

    # --------------------------
    # mock get_context()
    # --------------------------
    with patch("backend.model.model.get_context", new_callable=AsyncMock) as mock_context:
        mock_context.return_value = "FAKE_CONTEXT"

        # ------------------------------------
        # mock HTTP client and response
        # ------------------------------------
        fake_http_client = AsyncMock()

        fake_response = MagicMock()
        fake_response.status_code = 200
        fake_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Implement login page UI.\n**Story Points: 8**"
                    }
                }
            ]
        }

        fake_http_client.post.return_value = fake_response

        with patch("backend.model.model.get_http_client", return_value=fake_http_client):

            # --------------------------
            # mock task_service.create_task()
            # --------------------------
            with patch("backend.model.model.task_service.create_task", new_callable=AsyncMock) as mock_create:

                result = await enrich_task_details(req)

                # --------------------------
                # asserts
                # --------------------------

                # Returned result structure
                assert result["story_points"] == 8
                assert "Implement login page UI" in result["ai_description"]
                assert result["used_context_text"] == "FAKE_CONTEXT"

                # Ensure create_task was called
                mock_create.assert_awaited_once()
                created_task_arg = mock_create.call_args[0][0]

                # Check enriched task fields
                assert created_task_arg.story_points == 8
                assert created_task_arg.ai_description == "Implement login page UI."

