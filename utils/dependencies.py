from typing import Annotated, Optional
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status
from database import get_db
from models import User
from utils.helper import oauth2_bearer, SECRET_KEY, ALGORITHM

db_dependency = Annotated[Session, Depends(get_db)]


async def get_current_user(
    token: Annotated[Optional[str], Depends(oauth2_bearer)],
    db: db_dependency
) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided"
        )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth payload")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account inactive or not found")
        
        return user
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


async def get_optional_current_user(
    token: Annotated[Optional[str], Depends(oauth2_bearer)],
    db: db_dependency
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("id")
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user if user and user.is_active else None
    except JWTError:
        return None


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)]
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


user_dependency = Annotated[User, Depends(get_current_user)]
admin_dependency = Annotated[User, Depends(get_current_admin)]