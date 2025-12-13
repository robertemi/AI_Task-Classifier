from unittest.mock import MagicMock
from backend.rag.retriever import RAGService


def test_get_previous_tasks():

    rag = RAGService()
    rag.vs = MagicMock()

    # Mocked vector-store response with task chunks
    rag.vs.query.return_value = {
        "documents": [["Task chunk A", "Task chunk B"]]
    }

    result = rag.get_previous_tasks("P123")

    assert result == ["Task chunk A", "Task chunk B"]

    # Ensure query was called correctly
    rag.vs.query.assert_called_once_with(
        project_id="P123",
        query_text="",
        k=50,
        where={"type": "task"}
    )

def test_get_previous_tasks_empty():

    rag = RAGService()
    rag.vs = MagicMock()

    rag.vs.query.return_value = {
        "documents": [[]]
    }

    result = rag.get_previous_tasks("P123")

    assert result == []  # empty list returned
