from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Selo, Tenant, User
from app.schemas import SeloCreate, SeloOut
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/selos", tags=["Selos"])

@router.post("/{cnpj}", response_model=SeloOut)
def criar_selo(request: Request, cnpj: str, selo: SeloCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant = db.query(Tenant).filter(Tenant.cnpj == cnpj_limpo).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
        
    novo_selo = Selo(
        tenant_cnpj=cnpj_limpo,
        nome=selo.nome,
        cor_hex=selo.cor_hex
    )
    db.add(novo_selo)
    db.commit()
    db.refresh(novo_selo)
    return novo_selo

@router.get("/{cnpj}", response_model=List[SeloOut])
def listar_selos(request: Request, cnpj: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Acesso negado")
    return db.query(Selo).filter(Selo.tenant_cnpj == cnpj_limpo).all()

@router.put("/{selo_id}", response_model=SeloOut)
def atualizar_selo(request: Request, selo_id: int, selo_data: SeloCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    selo = db.query(Selo).filter(Selo.id == selo_id).first()
    if not selo or selo.tenant_cnpj != current_user.tenant_cnpj:
        raise HTTPException(status_code=404, detail="Selo não encontrado")
        
    selo.nome = selo_data.nome
    selo.cor_hex = selo_data.cor_hex
    db.commit()
    db.refresh(selo)
    return selo

@router.delete("/{selo_id}")
def deletar_selo(request: Request, selo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    selo = db.query(Selo).filter(Selo.id == selo_id).first()
    if not selo or selo.tenant_cnpj != current_user.tenant_cnpj:
        raise HTTPException(status_code=404, detail="Selo não encontrado")
        
    db.delete(selo)
    db.commit()
    return {"message": "Selo removido com sucesso"}
