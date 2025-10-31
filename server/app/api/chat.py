from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database import get_db
from app.schemas.chat import ChatMessageCreate, ChatMessageResponse, ChatHistoryResponse, ChatRequest
from app.models.chat_message import ChatMessage
from app.models.user import User
from typing import List
import os
import json
import logging

try:
    from google import genai
except Exception:
    genai = None

router = APIRouter()

@router.post("/message", response_model=ChatMessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    message_data: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # persist the user's message
    chat_message = ChatMessage(
        user_id=current_user.id,
        tree_session_id=message_data.tree_session_id,
        message=message_data.message,
        is_user_message=True
    )
    db.add(chat_message)
    db.commit()
    db.refresh(chat_message)

    # attempt to call Gemini / GenAI to obtain an assistant response
    assistant_text = None
    assistant_meta = None
    intent = None

    try:
        if genai is None:
            raise RuntimeError("genai library not available")

        # Build prompt instructing the Supervisor Agent to reply with JSON
        system_prompt = (
            "You are a Supervisor Agent for TreeView AI. Determine whether the user's input is a structural command (e.g., 'Insert node 8 as left child of 4') or an analytical query (e.g., 'What is the height?'). "
            "Return a single JSON object with the following keys: reply (string), intent (one of 'command' or 'analysis'), highlights (array of node ids to highlight, can be empty), operations (array of actions to perform on the tree, each action with keys: action, value, parent, side), explanation (string). ONLY return JSON. Use the provided current_tree_state to decide operations if needed."
        )

        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        # include current tree state if present on request body
        current_tree_state = None
        try:
            # message_data may contain extra keys if the client included them
            current_tree_state = getattr(message_data, 'current_tree_state', None)
            if current_tree_state is None and isinstance(message_data, dict):
                current_tree_state = message_data.get('current_tree_state')
        except Exception:
            current_tree_state = None

        user_payload = {
            "user_message": message_data.message,
            "current_tree_state": current_tree_state
        }

        contents = system_prompt + "\nUser payload (JSON):\n" + json.dumps(user_payload)

        response = client.models.generate_content(model="gemini-2.5-flash", contents=contents)
        raw = getattr(response, 'text', None) or str(response)
        # parse JSON
        assistant_meta = json.loads(raw)
        assistant_text = assistant_meta.get('reply') or assistant_meta.get('message') or json.dumps(assistant_meta)
        intent = assistant_meta.get('intent')
    except Exception as e:
        logging.exception("Failed to call Gemini/GenAI: %s", e)
        # fallback assistant behavior
        assistant_text = f"(Automated response not available) I received: {message_data.message}"
        assistant_meta = {"reply": assistant_text, "intent": "analysis", "highlights": [], "operations": [], "explanation": "Fallback response; GenAI not available."}

    # persist assistant message
    assistant_msg = ChatMessage(
        user_id=current_user.id,
        tree_session_id=message_data.tree_session_id,
        message=assistant_text,
        response=json.dumps(assistant_meta) if assistant_meta is not None else None,
        is_user_message=False,
        intent_type=intent
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return assistant_msg

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
