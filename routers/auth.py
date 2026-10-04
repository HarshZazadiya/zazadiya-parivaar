from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from utils.dependencies import db_dependency, user_dependency
from models import User
from schemas import UserCreate, UserLogin, Token, UserResponse
from utils.helper import bcrypt_context
from utils.jwt_utils import create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: db_dependency):
    existing_user = db.query(User).filter(User.email == user_data.email.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    new_user = User(
        email=user_data.email.strip().lower(),
        hashed_password=bcrypt_context.hash(user_data.password),
        full_name=user_data.full_name.strip(),
        phone_number=user_data.phone_number,
        village_name=user_data.village_name,
        role="user"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: db_dependency):
    user = db.query(User).filter(User.email == login_data.email.strip().lower()).first()
    if not user or not bcrypt_context.verify(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive. Please contact admin."
        )

    access_token = create_access_token(user.id, user.email, user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role
    )


@router.post("/token", response_model=Token)
async def login_for_access_token(db: db_dependency, form_data: OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not bcrypt_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(user.id, user.email, user.role)
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        role=user.role
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: user_dependency):
    return current_user
