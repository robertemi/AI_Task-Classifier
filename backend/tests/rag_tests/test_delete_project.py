from unittest.mock import MagicMock
from backend.rag.retriever import RAGService


def test_delete_project():

    rag = RAGService()
    rag.vs = MagicMock()

    # Run the method
    result = rag.delete_project("P123")

    # It returns None
    assert result is None

    # Ensure correct call to vector store
    rag.vs.delete_project.assert_called_once_with(
        project_id="P123"
    )

