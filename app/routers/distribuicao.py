import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import DistribuicaoNSU, DistribuicaoUltNSU, DistribuicaoChave
from app.dependencies import get_current_user
from app.services.distribuicao_service import get_tenant_and_acbr, sincronizar_tenant_nsu

router = APIRouter(prefix="/api/nfe/distribuicao", tags=["Distribuição"])

@router.post("/nsu")
def distribuicao_nsu(request: Request, data: DistribuicaoNSU, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        ret, resp = acbr.distribuicao_por_nsu(data.uf, data.cnpj, data.nsu)
        return {"retorno": ret, "resposta": json.loads(resp)}
    finally:
        acbr.finalizar()

@router.post("/chave")
def distribuicao_chave(request: Request, data: DistribuicaoChave, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        ret, resp = acbr.distribuicao_por_chave(data.uf, data.cnpj, data.chave)
        return {"retorno": ret, "resposta": json.loads(resp)}
    finally:
        acbr.finalizar()

@router.post("/ult-nsu")
def distribuicao_ult_nsu(request: Request, data: DistribuicaoUltNSU, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    sucesso, eventos, nsu, msg = sincronizar_tenant_nsu(data.cnpj, db)
    if not sucesso:
        status_code = 409 if "andamento" in msg else 429 if "SEFAZ" in msg else 500
        raise HTTPException(status_code=status_code, detail=msg)
        
    return {
        "nsu_atual": nsu,
        "eventos": eventos
    }
