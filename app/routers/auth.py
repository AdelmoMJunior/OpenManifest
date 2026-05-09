from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, field_validator
import re
from app.database import get_db
from app.models import User, Session as DBSession, Tenant
from app.services.auth import (
    get_password_hash, verify_password, create_access_token, create_user_session,
    create_email_verification_token, create_password_reset_token, create_change_email_token, verify_and_delete_token, email_service
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Autenticação"])

class UserCreate(BaseModel):
    email: str
    password: str
    tenant_cnpj: str

    @field_validator('email')
    def validate_email(cls, v):
        v = v.lower()
        if len(v) < 6:
            raise ValueError('O email deve ter no minimo 6 caracteres')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Formato de email invalido')
        return v

    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter no minimo 8 caracteres')
        if not re.search(r"[a-z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra minuscula')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra maiuscula')
        if not re.search(r"[0-9]", v):
            raise ValueError('A senha deve ter pelo menos um numero')
        return v

class ForgotPassword(BaseModel):
    email: str
    
class ResetPassword(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter no minimo 8 caracteres')
        if not re.search(r"[a-z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra minuscula')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra maiuscula')
        if not re.search(r"[0-9]", v):
            raise ValueError('A senha deve ter pelo menos um numero')
        return v

class ChangePassword(BaseModel):
    current_password: str
    new_password: str
    
    @field_validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter no minimo 8 caracteres')
        if not re.search(r"[a-z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra minuscula')
        if not re.search(r"[A-Z]", v):
            raise ValueError('A senha deve ter pelo menos uma letra maiuscula')
        if not re.search(r"[0-9]", v):
            raise ValueError('A senha deve ter pelo menos um numero')
        return v

class ChangeEmail(BaseModel):
    new_email: str
    
    @field_validator('new_email')
    def validate_email(cls, v):
        v = v.lower()
        if len(v) < 6:
            raise ValueError('O email deve ter no minimo 6 caracteres')
        if not re.match(r"[^@]+@[^@]+\.[^@]+", v):
            raise ValueError('Formato de email invalido')
        return v

class ResendVerification(BaseModel):
    email: str

class VerifyToken(BaseModel):
    token: str

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Verifica se o e-mail já está em uso
    email_lower = user.email.lower()
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail já está cadastrado no sistema."
        )
        
    # 2. Verifica se já existe um usuário para este CNPJ (Trava 1 Usuário por Empresa)
    if db.query(User).filter(User.tenant_cnpj == user.tenant_cnpj).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe uma conta vinculada a este CNPJ."
        )

    # 3. Gerencia o Tenant
    tenant = db.query(Tenant).filter(Tenant.cnpj == user.tenant_cnpj).first()
    if not tenant:
        # Se não existe o tenant, cria
        tenant = Tenant(cnpj=user.tenant_cnpj)
        db.add(tenant)
        db.commit()
        
    # 4. Cria o novo usuário
    new_user = User(
        email=email_lower,
        password_hash=get_password_hash(user.password),
        tenant_cnpj=tenant.cnpj,
        is_verified=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 5. Gera token e envia e-mail
    token = create_email_verification_token(new_user.id)
    email_service.send_verification_email(new_user.email, token)
    
    return {"message": "Cadastro realizado! Verifique seu e-mail para ativar a conta."}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email_lower = form_data.username.lower()
    user = db.query(User).filter(User.email == email_lower).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="E-mail não verificado. Verifique a sua caixa de entrada.",
        )
        
    # Invalida sessoes antigas no BD
    db.query(DBSession).filter(DBSession.user_id == user.id).update({"is_active": False})
    
    # Gera Sessão (JTI unico, salva no Redis)
    jti = create_user_session(user.id)
    
    # Salva JTI no BD (Fallback)
    new_session = DBSession(user_id=user.id, jti=jti, is_active=True)
    db.add(new_session)
    db.commit()
    
    # Gera JWT
    access_token = create_access_token(data={"sub": str(user.id), "jti": jti, "cnpj": user.tenant_cnpj})
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/verify-email")
def verify_email(data: VerifyToken, db: Session = Depends(get_db)):
    user_id = verify_and_delete_token("verify_email", data.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
        
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.is_verified = True
        db.commit()
        return {"message": "E-mail verificado com sucesso! Você já pode fazer login."}
    raise HTTPException(status_code=400, detail="Usuário não encontrado")

@router.post("/forgot-password")
def forgot_password(data: ForgotPassword, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    user = db.query(User).filter(User.email == email_lower).first()
    if user:
        token = create_password_reset_token(user.id)
        email_service.send_reset_password_email(user.email, token)
        
    return {"message": "Se o e-mail estiver cadastrado em nossa base, um link de recuperação será enviado em instantes."}

@router.post("/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    user_id = verify_and_delete_token("reset_password", data.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Token de recuperação inválido ou expirado")
        
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.password_hash = get_password_hash(data.new_password)
        # Ao trocar de senha, derruba todas as sessões ativas (Roubo de Cookie/Sessão)
        db.query(DBSession).filter(DBSession.user_id == user.id).update({"is_active": False})
        db.commit()
        return {"message": "Senha alterada com sucesso! Você já pode fazer login."}
        
    raise HTTPException(status_code=400, detail="Usuário não encontrado")

@router.post("/change-password")
def change_password(data: ChangePassword, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
        
    current_user.password_hash = get_password_hash(data.new_password)
    # Derruba as outras sessões
    db.query(DBSession).filter(DBSession.user_id == current_user.id).update({"is_active": False})
    db.commit()
    return {"message": "Senha alterada com sucesso! Você precisará fazer login novamente."}

@router.post("/change-email")
def change_email(data: ChangeEmail, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    email_lower = data.new_email.lower()
    
    # Verifica se já está em uso
    if db.query(User).filter(User.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Este e-mail já está em uso")
        
    token = create_change_email_token(current_user.id, email_lower)
    email_service.send_change_email(email_lower, token)
    return {"message": "Enviamos um link de confirmação para o seu novo e-mail."}

@router.post("/verify-new-email")
def verify_new_email(data: VerifyToken, db: Session = Depends(get_db)):
    result = verify_and_delete_token("change_email", data.token)
    if not result:
        raise HTTPException(status_code=400, detail="Token inválido ou expirado")
        
    user_id, new_email = result
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # Só pra ter certeza que ninguém pegou no meio tempo
        if not db.query(User).filter(User.email == new_email).first():
            user.email = new_email
            db.commit()
            return {"message": "Seu e-mail foi alterado com sucesso!"}
        raise HTTPException(status_code=400, detail="O e-mail já foi registrado por outra conta")
        
    raise HTTPException(status_code=400, detail="Usuário não encontrado")

@router.post("/resend-verification")
def resend_verification(data: ResendVerification, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    user = db.query(User).filter(User.email == email_lower).first()
    
    if user and not user.is_verified:
        token = create_email_verification_token(user.id)
        email_service.send_verification_email(user.email, token)
        
    # Genérico para evitar enumeração
    return {"message": "Se sua conta existir e ainda não estiver verificada, um novo link será enviado."}

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "tenant_cnpj": current_user.tenant_cnpj,
        "full_name": getattr(current_user, "full_name", current_user.email),
        "created_at": str(getattr(current_user, "created_at", "")),
    }

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Invalida todas as sessões ativas do usuário
    db.query(DBSession).filter(DBSession.user_id == current_user.id).update({"is_active": False})
    db.commit()
    return {"message": "Logout realizado com sucesso."}
