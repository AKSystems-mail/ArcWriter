import re

class RagService:
    def __init__(self):
        pass

    def chunk_markdown(self, markdown_text: str) -> list[dict]:
        """
        Splits a markdown file into chunks based on headers.
        Returns a list of dicts with 'header' and 'content'.
        """
        chunks = []
        # Simple regex to find headers
        pattern = r'(^#{1,6}\s+.+$)'
        parts = re.split(pattern, markdown_text, flags=re.MULTILINE)
        
        current_header = "Introduction"
        current_content = []
        
        for part in parts:
            if re.match(pattern, part, re.MULTILINE):
                if current_content:
                    chunks.append({
                        "header": current_header,
                        "content": "".join(current_content).strip()
                    })
                current_header = part.strip()
                current_content = []
            else:
                current_content.append(part)
        
        if current_content:
             chunks.append({
                "header": current_header,
                "content": "".join(current_content).strip()
            })
            
        return chunks

    def index_bible(self, project_id: str, bible_text: str):
        """
        Indexes the bible content into the vector store.
        (Mock implementation)
        """
        chunks = self.chunk_markdown(bible_text)
        print(f"Indexing {len(chunks)} chunks for project {project_id}")
        # Call to Vector Search API would go here

    def search_bible(self, project_id: str, query: str) -> list[str]:
        """
        Retrieves relevant context for a query.
        """
        print(f"Searching bible for: {query}")
        return ["Mock context from Character Bio", "Mock context from Theme Definitions"]
