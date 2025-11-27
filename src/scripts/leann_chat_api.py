"""
API wrapper for LeannChat to be used by the backend server
Accepts dynamic user_id and provides chat functionality
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import site

# Ensure user site-packages is in path (fixes ROS environment issues)
user_site = site.getusersitepackages()
if user_site not in sys.path:
    sys.path.insert(0, user_site)

# Now try to import leann
try:
    from leann import LeannChat
except ImportError as e:
    print(f"Error: Could not import leann module: {e}")
    print(f"User site-packages: {user_site}")
    print(f"Python path: {sys.path[:3]}")
    raise ImportError(
        "leann module not found. Please install it with: pip install --user leann"
    )

from memori.utils import StringUtils, FileUtils
from memori import Memori
import sys
from pathlib import Path

# Import our wrapper for safe Memori search
sys.path.insert(0, str(Path(__file__).parent))
from memori_wrapper import IsolatedMemoriSearch


class LeannChatAPI:
    """
    Wrapper class for LeannChat that accepts dynamic user_id
    and provides a clean API for the backend
    """

    def __init__(self, user_id: str, user_email: str = None):
        """
        Initialize LeannChat with a specific user_id

        Args:
            user_id: Unique identifier for the user
            user_email: Email of the user (for better Memori context)
        """
        self.user_id = user_id
        self.user_email = user_email

        # Setup paths
        data_dir = Path(__file__).resolve().parents[2] / "data"
        env_path = Path(__file__).resolve().parents[2] / ".env"
        usr_dir = Path(__file__).resolve().parents[2] / "db/users"

        # Load environment
        load_dotenv(dotenv_path=env_path)
        os.environ["OPENAI_API_KEY"]

        self.INDEX_PATH = str(data_dir / "index")

        # Generate session ID
        self.session_id = StringUtils.generate_id("session_")

        # Setup user directory
        base_user_path = FileUtils.ensure_directory(usr_dir / user_id)

        # Database connection string
        self.database_connect = "postgresql://useradmin:userdb1234@localhost/userdb"

        # Initialize Memori with conscious processing enabled
        print(f"[Memori] Initializing Memori with conscious_ingest=True for user {user_id}")
        self.memori = Memori(
            user_id=user_id,
            assistant_id="leann_assistant",
            session_id=self.session_id,
            database_connect=self.database_connect,
            model="gpt-4o-mini",  # Model for conscious processing
            conscious_ingest=True,  # Enable intelligent memory processing
            auto_ingest=False,  # Disable automatic background processing
            verbose=False  # Reduce logging noise
        )

        # Enable Memori (required before use)
        self.memori.enable()
        print(f"[Memori] Memori enabled for user {user_id}")

        # Initialize our safe search wrapper that uses Memori's retrieve_context
        self.memory_search = IsolatedMemoriSearch(memori_instance=self.memori)

        # Initialize LeannChat
        self.chat = LeannChat(
            self.INDEX_PATH,
            llm_config={
                "type": "openai",
                "model": "gpt-4.1-mini",
                "max_tokens": 500  # Limit response length to keep answers concise
            },
        )

    def _store_conversation_to_memori(self, user_input: str, ai_output: str):
        """Store conversation in Memori with conscious processing"""
        try:
            print(f"[Memori] Recording conversation with conscious_ingest=True")
            # Use record_conversation which is designed for chat exchanges
            chat_id = self.memori.record_conversation(
                user_input=user_input,
                ai_output=ai_output,
                model="gpt-4.1-mini",
                metadata={
                    "type": "immigration_query",
                    "assistant": "leann_assistant"
                }
            )
            print(f"[Memori] Conversation recorded with chat_id: {chat_id}")
        except Exception as e:
            print(f"[Memori] Error recording conversation: {e}")
            import traceback
            traceback.print_exc()

    def _get_relevant_memories(self, query: str, limit: int = 5):
        """Get relevant memories for this user using safe search wrapper"""
        try:
            print(f"[Memori] Searching memories for user {self.user_id}")
            # Use our wrapper which ensures user_id isolation
            memories = self.memory_search.search(
                query=query,
                limit=limit,
                assistant_id="leann_assistant",
                session_id=self.session_id,
                memory_types=["short_term", "long_term"]
            )
            print(f"[Memori] Found {len(memories)} relevant memories")
            return memories
        except Exception as e:
            print(f"[Memori] Error searching memories: {e}")
            import traceback
            traceback.print_exc()
            return []

    def ask(self, query: str, top_k: int = 3, recompute_embeddings: bool = False):
        """
        Ask a question using Memori-enhanced LeannChat RAG

        Flow:
        1. Retrieve user's LTM/STM/chat_history from Memori (user-specific, isolated)
        2. Pass memories + query to LeannChat RAG (shared documents)
        3. LeannChat's LLM synthesizes answer using:
           - User's personal context from Memori
           - Document knowledge from RAG
        4. Store conversation in Memori with conscious_ingest for future recall

        Args:
            query: The user's question
            top_k: Number of top documents to retrieve from RAG
            recompute_embeddings: Whether to recompute embeddings

        Returns:
            Response from LeannChat with Memori context
        """
        try:
            # ALWAYS check Memori LTM first
            print(f"[Memori] Searching LTM/STM for relevant memories...")
            relevant_memories = self._get_relevant_memories(query, limit=5)

            # Build memory context
            memory_context = ""
            if relevant_memories:
                memory_context = "\n\nPrevious user-specific information:\n"
                for mem in relevant_memories:
                    summary = mem.get('summary', mem.get('searchable_content', ''))
                    if summary:
                        memory_context += f"- {summary}\n"
                print(f"[Memori] Found {len(relevant_memories)} relevant memories")

            # Pass memory context TO LeannChat so its LLM can synthesize
            # an answer based on BOTH user memories + document knowledge
            enhanced_query = f"{memory_context}User question: {query}" if memory_context else query

            print(f"[LeannChat] Querying RAG with Memori context...")
            response = self.chat.ask(
                enhanced_query,  # LeannChat's LLM sees both memories + documents
                top_k=top_k,
                recompute_embeddings=recompute_embeddings
            )

            # Extract response
            if isinstance(response, dict) and 'answer' in response:
                response_text = response['answer']
            elif isinstance(response, str):
                response_text = response
                response = {"answer": response, "sources": []}
            else:
                response_text = str(response)
                response = {"answer": response_text, "sources": []}

            # Store this exchange in Memori with conscious processing
            # Memori's LLM will intelligently categorize what's important
            print(f"[Memori] Storing conversation with conscious_ingest=True")
            self._store_conversation_to_memori(query, response_text)

            return response
        except Exception as e:
            print(f"Error in ask(): {e}")
            import traceback
            traceback.print_exc()
            return {
                "answer": f"I apologize, but I encountered an error: {str(e)}",
                "sources": []
            }

    def get_session_info(self):
        """Get information about the current session"""
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "index_path": self.INDEX_PATH
        }

    def cleanup(self):
        """Cleanup resources"""
        try:
            # Cleanup Memori wrapper connections
            if hasattr(self, 'memory_search'):
                self.memory_search.cleanup()
                print(f"[Memori] Cleaned up search wrapper resources")
        except Exception as e:
            print(f"[Memori] Error during cleanup: {e}")


# For backwards compatibility with the standalone script
if __name__ == "__main__":
    # This maintains the original interactive functionality
    from leann import interactive_utils

    # Use default user_id for standalone mode
    user_id = "2d9b104a-7aa7-40f6-84d6-cb789137c6f4"

    # Initialize the API
    chat_api = LeannChatAPI(user_id)

    print(f"Initialized LEANN Chat for user: {user_id}")
    print(f"Session ID: {chat_api.session_id}")

    # Create an interactive session for RAG
    session = interactive_utils.create_rag_session(
        app_name="immigration",
        data_description="visa rules",
    )

    # Define how to handle queries
    def handle_query(query: str):
        response = chat_api.ask(query, top_k=1, recompute_embeddings=False)
        print(f"\nAssistant: {response}\n")

    # Run the interactive loop
    try:
        session.run_interactive_loop(handle_query)
    finally:
        chat_api.cleanup()
