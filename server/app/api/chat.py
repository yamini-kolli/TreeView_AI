from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database import get_db
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatHistoryResponse
from app.models.chat_message import ChatMessage
from app.models.user import User
from typing import List

router = APIRouter()

@router.post("/message", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    chat_message = ChatMessage(
        user_id=current_user.id,
        tree_session_id=message_data.tree_session_id,
        message=message_data.message,
        is_user_message=True
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)
    return chat_message

@router.get("/history/{session_id}", response_model=ChatHistoryResponse)
async def get_chat_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id, ChatMessage.tree_session_id == session_id).order_by(ChatMessage.created_at.asc()).all()
    return ChatHistoryResponse(messages=messages, total=len(messages))

@router.delete("/history/{session_id}")
async def clear_chat_history(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    messages = db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id, ChatMessage.tree_session_id == session_id).all()
    for msg in messages:
        db.delete(msg)
    db.commit()
    return {"message": "Chat history cleared"}
