from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os
from dotenv import load_dotenv
from functools import wraps
from sqlalchemy.orm import Session

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable must be set!")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        truncated_bytes = password_bytes[:72]
        while truncated_bytes and truncated_bytes[-1] & 0b11000000 == 0b10000000:
            truncated_bytes = truncated_bytes[:-1]
        password = truncated_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        password_bytes = plain_password.encode('utf-8')
        if len(password_bytes) > 72:
            truncated_bytes = password_bytes[:72]
            while truncated_bytes and truncated_bytes[-1] & 0b11000000 == 0b10000000:
                truncated_bytes = truncated_bytes[:-1]
            plain_password = truncated_bytes.decode('utf-8', errors='ignore')
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
   
    from .database import SessionLocal
    from .models import User, Shelter
    
    
    db = SessionLocal()
    
    try:
        
        token = credentials.credentials
        
        
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        user_type = payload.get("user_type", "user")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )
        
        
        if user_type == "shelter":
            user = db.query(Shelter).filter(Shelter.id == user_id).first()
        else:
            user = db.query(User).filter(User.id == user_id).first()
            
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    finally:
        db.close()

def require_role(allowed_roles: list):
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, current_user=None, **kwargs):
            user_role = None
            if hasattr(current_user, 'role'):
                user_role = current_user.role.value if current_user.role else None
            elif hasattr(current_user, '__tablename__'):
                if current_user.__tablename__ == "shelters":
                    user_role = "shelter"
                    
            if user_role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
                )
            
            return func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator