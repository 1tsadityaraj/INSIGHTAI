from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseFetcher(ABC):
    @abstractmethod
    async def fetch(self, query: str) -> Dict[str, Any]:
        """
        Fetch data based on a query string.
        Returns a dictionary containing the fetched data.
        """
        pass
