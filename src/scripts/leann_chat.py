# can add LeannSeearcher

from memori import Memori
from memori.utils import StringUtils, FileUtils
import os
from dotenv import load_dotenv
from pathlib import Path
from leann import LeannChat, interactive_utils



data_dir = Path(__file__).resolve().parents[2] / "data"
env_path = Path(__file__).resolve().parents[2] / ".env"
usr_dir = Path(__file__).resolve().parents[2] / "db/users"

load_dotenv(dotenv_path=env_path)
os.environ["OPENAI_API_KEY"] 
INDEX_PATH = str(data_dir / "index")

# Unique user/session IDs
user_id = "2d9b104a-7aa7-40f6-84d6-cb789137c6f4"  # You can generate dynamically
session_id = StringUtils.generate_id("session_")

# Optional: local fallback path per user
#base_user_path = FileUtils.ensure_directory(f"userdb/users/{user_id}")
base_user_path = FileUtils.ensure_directory(usr_dir / user_id)
memory = Memori(
    database_connect="postgresql://useradmin:userdb1234@localhost/userdb",
    user_id=user_id,                # Identifies which user's memory to load/store
    session_id=session_id,          # STM per session

    conscious_ingest=True,          # Enable background AI analysis
    verbose=True,                   # Show debug/info messages
    openai_api_key=None,            # Uses OPENAI_API_KEY from environment
    model="gpt-4.1-mini"            # Model used for embedding and reasoning
)
memory.enable()
# Example usage

chat = LeannChat(
    INDEX_PATH,
    llm_config={"type": "openai", "model": "gpt-4.1-mini"},
)

# Create an interactive session for RAG
session = interactive_utils.create_rag_session(
    app_name="immigration",
    data_description="visa rules",
   
)

# Define how to handle queries
def handle_query(query: str):
    response = chat.ask(query, top_k=1, recompute_embeddings=False)
    print(f"\nAssistant: {response}\n")

# Run the interactive loop
session.run_interactive_loop(handle_query)



# Chat with your data
#chat = LeannChat(INDEX_PATH, llm_config={"type": "hf", "model": "Qwen/Qwen3-0.6B"})
#response = chat.ask("How much storage does LEANN save?", top_k=1)