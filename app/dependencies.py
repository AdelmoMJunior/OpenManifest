from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.database import get_db
from app.models import User, Session as DBSession
from app.services.auth import SECRET_KEY, ALGORITHM, is_jti_valid_redis

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = int(payload.get("sub"))
        jti: str = payload.get("jti")
        if user_id is None or jti is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # 1. Verifica no Redis (rapido)
    if not is_jti_valid_redis(user_id, jti):
        # 2. Fallback pro Postgres se o Redis negou ou falhou
        db_session = db.query(DBSession).filter(
            DBSession.user_id == user_id,
            DBSession.jti == jti,
            DBSession.is_active == True
        ).first()
        
        if not db_session:
            raise credentials_exception
            
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user
