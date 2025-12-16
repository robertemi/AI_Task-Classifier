from unittest.mock import MagicMock
from backend.rag.retriever import RAGService


def test_get_project_by_id():

    rag = RAGService()
    rag.vs = MagicMock()  # prevent real DB access

    # Mock vector-store response
    rag.vs.query.return_value = {
        "documents": [["Chunk A", "Chunk B"]],
    }

    result = rag.get_project_by_id("P123")

    # It should join the documents with newline
    assert result == "Chunk A\nChunk B"

    # Ensure query was called correctly
    rag.vs.query.assert_called_once_with(
        project_id="P123",
        query_text="",
        k=50,
        where={"type": "project"},
    )
