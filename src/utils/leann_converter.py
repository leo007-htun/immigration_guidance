import sys
import site
from pathlib import Path
from leann import LeannBuilder
from document_rag import DocumentRAG
from types import SimpleNamespace
from dotenv import load_dotenv
import asyncio
import os

# Add utils directory to path for local imports
utils_dir = str(Path(__file__).parent)
if utils_dir not in sys.path:
    sys.path.insert(0, utils_dir)

# Ensure user site-packages is in path (fixes module import issues)
user_site = site.getusersitepackages()
if user_site not in sys.path:
    sys.path.insert(0, user_site)




env_path = Path(__file__).resolve().parents[2] / ".env"
data_dir = Path(__file__).resolve().parents[2] / "data"
load_dotenv(dotenv_path=env_path)
os.environ["OPENAI_API_KEY"] 


args = SimpleNamespace(
    data_dir=str(data_dir),          # folder containing your PDFs
    file_types=[".pdf"],        # filter PDFs
    chunk_size=256,
    chunk_overlap=128,
    enable_code_chunking=False,
    max_items=0,
)

rag = DocumentRAG()
all_chunks = asyncio.run(rag.load_data(args))
print(f"Extracted {len(all_chunks)} text chunks")

# Build LEANN index
INDEX_PATH = str(data_dir / "index")
builder = LeannBuilder(
    backend_name="hnsw",
    embedding_mode="openai",
    embedding_model="text-embedding-3-small",
    is_compact=False,
    is_recompute=False
)

# Add all text chunks
for chunk in all_chunks:
    builder.add_text(chunk['text'])

builder.build_index(INDEX_PATH)
print(f"Index saved to: {INDEX_PATH}")


