import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from backend.model.model import enrich_edited_task


@pytest.mark.asyncio
async def test_enrich_edited_task_success():

    # -----------------------------------------------------
    # mock get_context()
    # -----------------------------------------------------
    with patch("backend.model.model.get_context", new_callable=AsyncMock) as mock_context:
        mock_context.return_value = "FAKE_EDIT_CONTEXT"

        # -----------------------------------------------------
        # mock HTTP client + response
        # -----------------------------------------------------
        fake_http_client = AsyncMock()

        fake_response = MagicMock()
        fake_response.status_code = 200
        fake_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Updated description.\n**Story Points: 5**"
                    }
                }
            ]
        }

        fake_http_client.post.return_value = fake_response

        with patch("backend.model.model.get_http_client", return_value=fake_http_client):

            
            ai_description, ai_story_points = await enrich_edited_task(
                taskId="t1",
                projectId="p1",
                user_id="user123",
                new_task_title="New title",
                new_task_user_description="New desc"
            )


            assert ai_description == "Updated description."

            assert ai_story_points == 5
