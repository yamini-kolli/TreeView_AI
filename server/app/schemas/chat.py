from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ChatMessageBase(BaseModel):
    message: str = Field(..., min_length=1)

class ChatMessageCreate(ChatMessageBase):
    tree_session_id: str
    current_tree_state: Optional[dict] = None

class ChatMessageResponse(BaseModel):
    id: str
    user_id: str
    tree_session_id: str
    message: str
    response: Optional[str] = None
    is_user_message: bool
    intent_type: Optional[str] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    tree_session_id: str
    current_tree_state: Optional[dict] = None

class ChatResponse(BaseModel):
    message: str
    response: str
    intent_type: str
    action: Optional[dict] = None
    tree_data: Optional[dict] = None
    message_id: str

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total: int
