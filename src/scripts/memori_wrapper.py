"""
Wrapper to safely use Memori's retrieve_context with guaranteed user isolation
"""
from typing import Any


class IsolatedMemoriSearch:
    """
    Wrapper that uses Memori.retrieve_context() which properly filters by user_id

    This ensures user isolation by leveraging Memori's built-in search that
    passes user_id to the database manager's search_memories() method
    """

    def __init__(self, memori_instance):
        """
        Initialize with a Memori instance

        Args:
            memori_instance: An initialized Memori object with user_id already set
        """
        self.memori = memori_instance

    def search(
        self,
        query: str,
        limit: int = 5,
        **kwargs  # Accept other args for compatibility but ignore them
    ) -> list[dict[str, Any]]:
        """
        Search memories with proper user_id isolation using Memori's retrieve_context

        Args:
            query: Search query string
            limit: Maximum number of results

        Returns:
            List of memory dictionaries
        """
        # Use Memori's retrieve_context which properly filters by user_id
        results = self.memori.retrieve_context(query=query, limit=limit)
        return results

    def cleanup(self):
        """Cleanup is handled by Memori instance"""
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()
