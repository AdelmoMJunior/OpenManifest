import os
import redis
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "fallback_secret_key")
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRATION_MINUTES", "1440"))
REDIS_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")

# Redis pool
try:
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
except:
    redis_client = None

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_user_session(user_id: int):
    # Gera um JTI unico
    jti = str(uuid.uuid4())
    
    # Invalida todas no Redis (chave unica por user)
    if redis_client:
        try:
            # Salva o jti valido com TTL igual a expiracao do JWT
            redis_client.setex(
                f"session:{user_id}", 
                ACCESS_TOKEN_EXPIRE_MINUTES * 60, 
                jti
            )
        except Exception as e:
            print(f"Erro no Redis: {e}")
            
    return jti

def is_jti_valid_redis(user_id: int, jti: str) -> bool:
    if not redis_client:
        return False
    try:
        active_jti = redis_client.get(f"session:{user_id}")
        return active_jti == jti
    except:
        return False

# --- E-mail e Recuperacao (Tokens) ---
def create_email_verification_token(user_id: int) -> str:
    token = str(uuid.uuid4().hex)
    if redis_client:
        redis_client.setex(f"verify_email:{token}", 86400, user_id) # 24h
    return token

def create_password_reset_token(user_id: int) -> str:
    token = str(uuid.uuid4().hex)
    if redis_client:
        redis_client.setex(f"reset_password:{token}", 3600, user_id) # 1h
    return token

def create_change_email_token(user_id: int, new_email: str) -> str:
    token = str(uuid.uuid4().hex)
    if redis_client:
        # Salvamos como "user_id:new_email" para pegar ambos depois
        redis_client.setex(f"change_email:{token}", 3600, f"{user_id}:{new_email}")
    return token

def verify_and_delete_token(token_type: str, token: str):
    """Verifica se token existe. Para change_email retorna (user_id, email). Para outros, int(user_id)."""
    if not redis_client:
        return None
    key = f"{token_type}:{token}"
    data = redis_client.get(key)
    if data:
        redis_client.delete(key)
        if token_type == "change_email":
            parts = data.split(":", 1)
            return int(parts[0]), parts[1]
        return int(data)
    return None

class EmailService:
    def __init__(self):
        self.host = os.environ.get("SMTP_HOST")
        self.port = int(os.environ.get("SMTP_PORT", "2525"))
        self.user = os.environ.get("SMTP_USER")
        self.password = os.environ.get("SMTP_PASSWORD")
        self.from_email = os.environ.get("SMTP_FROM_EMAIL", "no-reply@kaisoft.com.br")
        self.frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip("/")

    def _send_email_real(self, to_email: str, subject: str, body: str):
        if not self.host or not self.user:
            return False
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.host, self.port)
            server.starttls()
            server.login(self.user, self.password)
            server.send_message(msg)
            server.quit()
            return True
        except Exception as e:
            print(f"Erro ao enviar email via SMTP: {e}")
            return False

    def send_verification_email(self, email: str, token: str):
        link = f"{self.frontend_url}/verify-email?token={token}"
        body = f"<h2>Bem-vindo(a)</h2><p>Clique no link para ativar sua conta:</p><a href='{link}'>{link}</a>"
        
        if not self._send_email_real(email, "Confirme sua conta", body):
            print(f"========== EMAIL SIMULADO (SMTP NÃO CONFIGURADO) ==========")
            print(f"Para: {email}")
            print(f"Assunto: Confirme sua conta")
            print(f"Link: {link}")
            print(f"===========================================================")

    def send_reset_password_email(self, email: str, token: str):
        body = f"<h2>Recuperacao de Senha</h2><p>Utilize este token no POST /auth/reset-password: {token}</p>"
        
        if not self._send_email_real(email, "Recuperacao de Senha", body):
            print(f"========== EMAIL SIMULADO (SMTP NÃO CONFIGURADO) ==========")
            print(f"Para: {email}")
            print(f"Assunto: Recuperacao de Senha")
            print(f"Token: {token}")
            print(f"===========================================================")

    def send_change_email(self, email: str, token: str):
        link = f"{self.frontend_url}/verify-new-email?token={token}"
        body = f"<h2>Troca de E-mail</h2><p>Clique no link para confirmar o novo endereço:</p><a href='{link}'>{link}</a>"
        
        if not self._send_email_real(email, "Solicitacao de Troca de E-mail", body):
            print(f"========== EMAIL SIMULADO (SMTP NÃO CONFIGURADO) ==========")
            print(f"Para: {email}")
            print(f"Assunto: Solicitacao de Troca de E-mail")
            print(f"Link: {link}")
            print(f"===========================================================")

email_service = EmailService()
