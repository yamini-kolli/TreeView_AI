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
import re
import uuid

from app.models.tree_session import TreeSession

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
        # pretty-print the user payload so multiple tree objects (if present) start on new lines
        contents = system_prompt + "\nUser payload (JSON):\n" + json.dumps(user_payload, indent=2)

        response = client.models.generate_content(model="gemini-2.5-flash", contents=contents)
        print("GenAI Response:", response)

        # Extract text from common response shapes (response.text or candidates)
        raw = None
        try:
            if hasattr(response, 'text') and getattr(response, 'text'):
                raw = response.text
            elif hasattr(response, 'candidates') and response.candidates:
                # Newer SDKs return candidates -> content -> parts -> text
                try:
                    raw = response.candidates[0].content.parts[0].text
                except Exception:
                    # Fallback to stringifying the first candidate
                    raw = str(response.candidates[0])
            else:
                raw = str(response)
        except Exception:
            raw = str(response)

        # Clean typical wrappers: strip markdown code fences and extract first JSON object
        cleaned = raw.strip() if raw is not None else ''
        # Remove surrounding Markdown code fences ```json ... ```
        cleaned = re.sub(r"^```[a-zA-Z0-9]*\\n", "", cleaned)
        cleaned = re.sub(r"\\n```$", "", cleaned)

        # Try to find a JSON object inside the text
        m = re.search(r"\{[\s\S]*\}", cleaned)
        json_text = m.group(0) if m else cleaned

        # parse JSON
        assistant_meta = None
        try:
            assistant_meta = json.loads(json_text)
        except Exception as parse_err:
            # Log the parsing failure and fall back to a safe assistant response
            logging.exception("Failed to parse assistant JSON response (%s). Raw response: %s", parse_err, raw)
            assistant_text = f"(Assistant parse error) I received: {message_data.message}"
            assistant_meta = {"reply": assistant_text, "intent": "analysis", "highlights": [], "operations": [], "explanation": "Fallback due to parse error."}
            intent = assistant_meta.get('intent')

        assistant_text = assistant_meta.get('reply') or assistant_meta.get('message') or json.dumps(assistant_meta)
        intent = assistant_meta.get('intent')
    except Exception as e:
        logging.exception("Failed to call Gemini/GenAI: %s", e)
        # fallback assistant behavior
        assistant_text = f"(Automated response not available) I received: {message_data.message}"
        assistant_meta = {"reply": assistant_text, "intent": "analysis", "highlights": [], "operations": [], "explanation": "Fallback response; GenAI not available."}

    # persist assistant message (initial creation)
    assistant_msg = ChatMessage(
        user_id=current_user.id,
        tree_session_id=message_data.tree_session_id,
        message=assistant_text,
        response=json.dumps(assistant_meta) if assistant_meta is not None else None,
        is_user_message=False,
        intent_type=intent
    )
    # If assistant returned operations, attempt to apply them to the tree session
    if assistant_meta and isinstance(assistant_meta.get('operations'), list) and message_data.tree_session_id:
        ops = assistant_meta.get('operations')
        apply_results = []
        try:
            ts = db.query(TreeSession).filter(TreeSession.id == message_data.tree_session_id, TreeSession.user_id == current_user.id).first()
            if ts:
                # Prefer client's current_tree_state if provided (so operations apply to the view the user sent)
                tree_data = None
                try:
                    if getattr(message_data, 'current_tree_state', None):
                        sent = message_data.current_tree_state
                        # basic validation
                        if isinstance(sent, dict) and (isinstance(sent.get('nodes', []), list) or isinstance(sent.get('edges', []), list)):
                            tree_data = sent
                except Exception:
                    tree_data = None

                if tree_data is None:
                    tree_data = ts.tree_data or {}
                # ensure nodes/edges lists exist for ReactFlow-like structure
                nodes = tree_data.get('nodes') or []
                edges = tree_data.get('edges') or []

                for op in ops:
                    action = op.get('action')
                    if action == 'insert':
                        value = op.get('value')
                        parent = op.get('parent')
                        # Detect side/direction from several possible keys the assistant might use
                        side_raw = None
                        for k in ('side', 'position', 'direction', 'location', 'where'):
                            if k in op and op.get(k) is not None:
                                side_raw = op.get(k)
                                break
                        # If position is an object with x/y, treat it as explicit position, not a side
                        explicit_pos = None
                        if isinstance(side_raw, dict) and ('x' in side_raw or 'y' in side_raw):
                            explicit_pos = side_raw
                            side = ''
                        else:
                            try:
                                side = str(side_raw or '').lower()
                            except Exception:
                                side = ''
                        # normalize common textual variants
                        if side and ('left' in side or 'l' == side or 'left_child' in side or 'leftchild' in side or 'west' in side):
                            side = 'left'
                        elif side and ('right' in side or 'r' == side or 'right_child' in side or 'rightchild' in side or 'east' in side):
                            side = 'right'
                        else:
                            # leave as-is (may be empty)
                            pass
                        new_id = str(uuid.uuid4())
                        # find parent by id or by label
                        parent_node = None
                        for n in nodes:
                            node_label = str(n.get('data', {}).get('label'))
                            if n.get('id') == str(parent) or node_label == str(parent):
                                parent_node = n
                                break

                        # create new node
                        # determine position: honor explicit position, otherwise place relative to parent
                        if explicit_pos:
                            new_x = explicit_pos.get('x', 0)
                            new_y = explicit_pos.get('y', 0)
                        elif parent_node:
                            parent_x = parent_node.get('position', {}).get('x', 0)
                            parent_y = parent_node.get('position', {}).get('y', 0)
                            offset = 160
                            if side == 'left':
                                new_x = parent_x - offset
                            elif side == 'right':
                                new_x = parent_x + offset
                            else:
                                # default to right if side not specified
                                new_x = parent_x + offset
                            new_y = parent_y + 40
                        else:
                            new_x = 0
                            new_y = 0

                        new_node = {
                            'id': new_id,
                            'data': {'label': str(value)},
                            'position': {'x': new_x, 'y': new_y},
                            'selected': False,
                            'sourcePosition': 'bottom',
                            'targetPosition': 'top'
                        }
                        nodes.append(new_node)

                        # create edge from parent to new node if parent found
                        if parent_node:
                            edge_id = f"reactflow__edge-{parent_node.get('id')}-{new_id}"
                            new_edge = {
                                'id': edge_id,
                                'source': parent_node.get('id'),
                                'target': new_id,
                                'animated': True,
                                'style': {'stroke': '#0d6efd', 'strokeWidth': 2},
                                'markerEnd': {'type': 'arrowclosed', 'color': '#0d6efd', 'width': 18, 'height': 18}
                            }
                            edges.append(new_edge)
                            apply_results.append({'operation': op, 'success': True, 'node_id': new_id, 'edge_id': edge_id})
                        else:
                            apply_results.append({'operation': op, 'success': False, 'reason': 'Parent node not found'})

                # write back tree_data
                tree_data['nodes'] = nodes
                tree_data['edges'] = edges
                ts.tree_data = tree_data
                db.add(ts)
                db.commit()
            else:
                apply_results.append({'success': False, 'reason': 'Tree session not found'})
        except Exception as e:
            logging.exception("Failed to apply operations to tree: %s", e)
            apply_results.append({'success': False, 'reason': str(e)})
        # attach results and tree_data
        assistant_meta['apply_results'] = apply_results
        # include updated tree_data for frontend convenience (if available)
        assistant_meta['tree_data'] = tree_data if 'tree_data' in locals() else None

    # ensure assistant_msg.response contains the latest assistant_meta after applying ops
    try:
        assistant_msg.response = json.dumps(assistant_meta) if assistant_meta is not None else None
    except Exception:
        # fallback: keep previous string representation
        assistant_msg.response = str(assistant_meta)

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
