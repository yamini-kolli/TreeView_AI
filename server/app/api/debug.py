from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()


@router.get('/user_exists')
async def user_exists(email: str, db: Session = Depends(get_db)):
    """Development helper: check whether a user with this email exists in the DB."""
    from app.models.user import User
    u = db.query(User).filter(User.email == email).first()
    return { 'user_found': bool(u), 'email': email }
