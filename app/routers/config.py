from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Tenant, User
from app.services.cert_utils import validar_certificado
from app.services.cnpj_ws import buscar_dados_cnpj
from app.dependencies import get_current_user

router = APIRouter(prefix="/config", tags=["Configuração"])

@router.post("/")
async def configurar_tenant(
    request: Request,
    cnpj: str = Form(...),
    ambiente: int = Form(1),
    senha_certificado: str = Form(...),
    ult_nsu: str = Form("0"),
    email: str = Form(None),
    telefone: str = Form(None),
    certificado: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Você não tem permissão para configurar este CNPJ.")
        
    if len(cnpj_limpo) != 14:
        raise HTTPException(status_code=400, detail="CNPJ inválido")

    # Ler e validar certificado
    pfx_data = await certificado.read()
    valido, msg, data_vencimento = validar_certificado(pfx_data, senha_certificado, cnpj_esperado=cnpj_limpo)
    if not valido:
        raise HTTPException(status_code=400, detail=msg)

    # Buscar dados na API da Receita/CNPJ.ws
    dados_empresa = buscar_dados_cnpj(cnpj_limpo)
    
    tenant = db.query(Tenant).filter(Tenant.cnpj == cnpj_limpo).first()
    if not tenant:
        tenant = Tenant(cnpj=cnpj_limpo)
        db.add(tenant)
        
    tenant.certificado_blob = pfx_data
    tenant.certificado_senha = senha_certificado
    tenant.certificado_vencimento = data_vencimento
    tenant.ambiente = ambiente
    tenant.ult_nsu = ult_nsu
    
    if email:
        tenant.email = email
    if telefone:
        tenant.telefone = telefone
        
    if dados_empresa:
        tenant.razao_social = dados_empresa["razao_social"]
        tenant.nome_fantasia = dados_empresa["nome_fantasia"]
        tenant.inscricao_estadual = dados_empresa["inscricao_estadual"]
        tenant.is_ie_ativa = dados_empresa["is_ie_ativa"]
        tenant.logradouro = dados_empresa["logradouro"]
        tenant.numero = dados_empresa["numero"]
        tenant.complemento = dados_empresa["complemento"]
        tenant.bairro = dados_empresa["bairro"]
        tenant.cep = dados_empresa["cep"]
        tenant.codigo_municipio = dados_empresa["codigo_municipio"]
        tenant.nome_municipio = dados_empresa["nome_municipio"]
        tenant.uf = dados_empresa["uf"]

    db.commit()
    db.refresh(tenant)
    
    return {"message": "Tenant configurado com sucesso!", "tenant": _tenant_to_dict(tenant)}

@router.get("/{cnpj}")
def consultar_config(request: Request, cnpj: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    tenant = db.query(Tenant).filter(Tenant.cnpj == cnpj_limpo).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não encontrado")
    return _tenant_to_dict(tenant)

def _tenant_to_dict(tenant):
    """Serializa o Tenant para JSON sem campos binários sensíveis."""
    return {
        "cnpj": tenant.cnpj,
        "razao_social": tenant.razao_social,
        "nome_fantasia": tenant.nome_fantasia,
        "inscricao_estadual": tenant.inscricao_estadual,
        "is_ie_ativa": tenant.is_ie_ativa,
        "logradouro": tenant.logradouro,
        "numero": tenant.numero,
        "complemento": tenant.complemento,
        "bairro": tenant.bairro,
        "cep": tenant.cep,
        "codigo_municipio": tenant.codigo_municipio,
        "nome_municipio": tenant.nome_municipio,
        "uf": tenant.uf,
        "email": tenant.email,
        "telefone": tenant.telefone,
        "ambiente": tenant.ambiente,
        "ult_nsu": tenant.ult_nsu,
        "certificado_vencimento": str(tenant.certificado_vencimento) if tenant.certificado_vencimento else None,
        "data_ultima_consulta_nsu": str(tenant.data_ultima_consulta_nsu) if tenant.data_ultima_consulta_nsu else None,
        "tem_certificado": tenant.certificado_blob is not None,
    }

