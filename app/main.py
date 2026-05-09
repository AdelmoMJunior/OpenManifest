import os
import time
import logging
from dotenv import load_dotenv

# Configura logging para aparecer nos logs do container
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Carrega Variaveis antes de tudo
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.database import engine, Base
from app.routers import config, distribuicao, eventos, envio, selos, notas, auth

# Configuração do Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Lógica de retry para aguardar o Postgres iniciar
retries = 5
while retries > 0:
    try:
        Base.metadata.create_all(bind=engine)
        print("Banco de dados inicializado com sucesso!")
        break
    except Exception as e:
        print(f"Aguardando banco de dados... (Tentativas restantes: {retries-1})")
        retries -= 1
        time.sleep(3)

app = FastAPI(
    title="API REST ACBrLibNFe Multi-Tenant",
    description="API para emissão, distribuição e eventos de NFe/NFCe usando ACBrLibNFe Linux MT",
    version="1.0.0"
)

# Adicionando o Limiter no App
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Ler origens permitidas
cors_origins_env = os.environ.get("CORS_ORIGINS", "")
if cors_origins_env:
    allow_origins = [orig.strip() for orig in cors_origins_env.split(",")]
else:
    # Se nao definido, permite apenas localmente
    allow_origins = ["http://localhost:3000", "http://localhost:8000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar pasta para inis de sessao
os.makedirs("inis", exist_ok=True)
os.makedirs("logs", exist_ok=True)
os.makedirs("certs", exist_ok=True)

app.include_router(auth.router)
app.include_router(config.router)
app.include_router(distribuicao.router)
app.include_router(eventos.router)
app.include_router(envio.router)
app.include_router(selos.router)
app.include_router(notas.router)

import asyncio
from app.services.worker import run_worker_loop

@app.on_event("startup")
async def startup_event():
    # Inicia a task do robô de sincronização assim que o Gunicorn/Uvicorn rodar
    asyncio.create_task(run_worker_loop())

@app.get("/")
def read_root():
    return {"message": "API REST ACBrLibNFe Rodando. Acesse /docs para a documentacao."}
