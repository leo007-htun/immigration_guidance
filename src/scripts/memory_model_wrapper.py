from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from memory_models import ExtendedChatHistory, ExtendedShortTermMemory, ExtendedLongTermMemory

# Database connection string
database_connect = "postgresql://useradmin:userdb1234@localhost/userdb"
engine = create_engine(database_connect)
Session = sessionmaker(bind=engine)
session = Session()

# Functions for creating memories
def create_user_chat_memory(user_id, chat_input, ai_output, model):
    ExtendedChatHistory.create(
        user_id=user_id,
        chat_input=chat_input,
        ai_output=ai_output,
        model=model,
        session=session,  # Pass the session
        session_id="some_session_id"  # Provide a session ID
    )

def create_user_short_term_memory(user_id, content):
    ExtendedShortTermMemory.create(
        user_id=user_id,
        content=content,
        session=session
    )

def create_user_long_term_memory(user_id, content):
    ExtendedLongTermMemory.create(
        user_id=user_id,
        content=content,
        session=session
    )

# Example usage
if __name__ == "__main__":
    create_user_chat_memory("user123", "Hello, how are you?", "I am an AI.", "chat_model")
    create_user_short_term_memory("user123", "This is a short-term memory.")
    create_user_long_term_memory("user123", "This is a long-term memory.")