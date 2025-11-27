# Import necessary modules
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from memori.database.models import ChatHistory as OriginalChatHistory
from memori.database.models import ShortTermMemory as OriginalShortTermMemory
from memori.database.models import LongTermMemory as OriginalLongTermMemory


# Extend ChatHistory
class ExtendedChatHistory(OriginalChatHistory):
    """Extended Chat History to include user association."""
    
    user_id = Column(String(255), ForeignKey('users.id'), nullable=False)

    user = relationship("User", back_populates="chats")

    @classmethod
    def create(cls, user_id, chat_input, ai_output, model, session, session_id):
        """Create a new chat history entry associated with a user."""
        new_chat = cls(
            chat_id=generate_unique_chat_id(),
            user_input=chat_input,
            ai_output=ai_output,
            model=model,
            session_id=session_id,
            user_id=user_id
        )
        session.add(new_chat)
        session.commit()


# Extend ShortTermMemory
class ExtendedShortTermMemory(OriginalShortTermMemory):
    """Extended Short Term Memory to include user association."""
    
    user_id = Column(String(255), ForeignKey('users.id'), nullable=False)

    user = relationship("User", back_populates="short_term_memories")
    
    @classmethod
    def create(cls, user_id, content, session):
        """Create a new short term memory entry."""
        new_memory = cls(
            content=content,
            user_id=user_id
        )
        session.add(new_memory)
        session.commit()


# Extend LongTermMemory
class ExtendedLongTermMemory(OriginalLongTermMemory):
    """Extended Long Term Memory to include user association."""
    
    user_id = Column(String(255), ForeignKey('users.id'), nullable=False)

    user = relationship("User", back_populates="long_term_memories")
    
    @classmethod
    def create(cls, user_id, content, session):
        """Create a new long term memory entry."""
        new_memory = cls(
            content=content,
            user_id=user_id
        )
        session.add(new_memory)
        session.commit()


# A utility function to generate unique chat IDs
def generate_unique_chat_id():
    import uuid
    return str(uuid.uuid4())