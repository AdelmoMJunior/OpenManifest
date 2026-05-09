import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import EnviarNotaBase
from app.services.distribuicao_service import get_tenant_and_acbr
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/nfe/enviar", tags=["Emissão NFe/NFCe"])

@router.post("/")
def enviar_nota(request: Request, data: EnviarNotaBase, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    
    try:
        # Configurar modelo correto
        acbr.acbr.NFE_ConfigGravarValor(
            acbr.handle,
            "NFe".encode("utf-8"),
            "ModeloDF".encode("utf-8"),
            ("0" if data.modelo == 55 else "1").encode("utf-8")
        )
        acbr.acbr.NFE_ConfigGravar(acbr.handle, acbr.ini_path.encode("utf-8"))

        acbr.limpar_lista()
        
        # Carregar a nota
        if data.conteudo_ini.strip().startswith("<"):
            acbr.carregar_xml(data.conteudo_ini)
        else:
            acbr.carregar_ini(data.conteudo_ini)
            
        # Assinar
        acbr.assinar()
        
        # Enviar (Lote 1 por padrão)
        ret, resp_str = acbr.enviar(1)
        
        try:
            return {"retorno": ret, "resposta": json.loads(resp_str)}
        except:
            return {"retorno": ret, "resposta": resp_str}
    finally:
        acbr.finalizar()
