import os
from typing import Annotated
from jose import JWTError, jwt
from database import SessionLocal
from sqlalchemy.orm import Session
from utils.helper import oauth2_bearer, SECRET_KEY, ALGORITHM
from fastapi import Depends, HTTPException
from models import User

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

async def get_current_requester_by_token(token: Annotated[str, Depends(oauth2_bearer)]):
    db = SessionLocal()
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        role = payload.get("role")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")

        return {
            "id": user.id,
            "name": user.full_name,
            "type": "user",
            "role": user.role
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    finally:
        db.close()