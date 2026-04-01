from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/login", response_model=UserResponse)
def login(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(User).filter(User.phone == user.phone).first()
    
    if db_user:
        # Update user info if exists
        db_user.name = user.name
        db.commit()
        db.refresh(db_user)
        return db_user
    
    # Create new user
    db_user = User(
        id=str(uuid.uuid4()),
        name=user.name,
        phone=user.phone,
        points=0,
        level="normal"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if phone already exists
    existing_user = db.query(User).filter(User.phone == user.phone).first()
    if existing_user:
        return existing_user
    
    db_user = User(
        id=str(uuid.uuid4()),
        name=user.name,
        phone=user.phone,
        points=0,
        level="normal"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.post("/{user_id}/add-points")
def add_points(user_id: str, points: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.points += points
    
    # Update level based on points
    if user.points >= 5000:
        user.level = "premium"
    elif user.points >= 1000:
        user.level = "vip"
    
    db.commit()
    db.refresh(user)
    return {"message": "Points added", "user": user}
