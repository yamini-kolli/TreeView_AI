from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user
from app.database import get_db
from app.schemas.tree import TreeSessionCreate, TreeSessionResponse, TreeSessionUpdate
from app.models.tree_session import TreeSession
from app.models.user import User
from typing import List

router = APIRouter()

@router.post("/sessions", response_model=TreeSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_tree_session(
    session_data: TreeSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_session = TreeSession(
        user_id=current_user.id,
        session_name=session_data.session_name,
        tree_type=session_data.tree_type,
        tree_data=session_data.tree_data,
        description=session_data.description
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/sessions", response_model=List[TreeSessionResponse])
async def list_tree_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sessions = db.query(TreeSession).filter(TreeSession.user_id == current_user.id).all()
    return sessions

@router.get("/sessions/{session_id}", response_model=TreeSessionResponse)
async def get_tree_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(TreeSession).filter(TreeSession.id == session_id, TreeSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Tree session not found")
    return session

@router.put("/sessions/{session_id}", response_model=TreeSessionResponse)
async def update_tree_session(
    session_id: str,
    session_update: TreeSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(TreeSession).filter(TreeSession.id == session_id, TreeSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Tree session not found")
    for key, value in session_update.dict(exclude_unset=True).items():
        setattr(session, key, value)
    db.commit()
    db.refresh(session)
    return session

@router.delete("/sessions/{session_id}")
async def delete_tree_session(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(TreeSession).filter(TreeSession.id == session_id, TreeSession.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Tree session not found")
    db.delete(session)
    db.commit()
    return {"message": "Tree session deleted successfully"}
