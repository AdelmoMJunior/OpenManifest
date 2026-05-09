import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import EventoConfirmacao, EventoCiencia, EventoDesconhecimento, EventoOperacaoNaoRealizada, EventoCancelamento, EventoCartaCorrecao
from app.services.distribuicao_service import get_tenant_and_acbr
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/nfe/evento", tags=["Eventos"])

def montar_enviar_evento(dados_evento: dict, acbr, tenant, tpEvento: str, db: Session = None):
    # Formata a data atual no padrão que o ACBr aceita
    dhEvento = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    ini_linhas = [
        "[EVENTO]",
        "idLote=1",
        "[EVENTO001]",
        f"chNFe={dados_evento['chNFe']}",
        f"cOrgao=91", # AN para manifestacao
        f"CNPJ={tenant.cnpj}",
        f"dhEvento={dhEvento}",
        f"tpEvento={tpEvento}",
        "nSeqEvento=1",
        "versaoEvento=1.00"
    ]
    
    if tpEvento == "210240": # Operacao nao realizada
        ini_linhas.append(f"xJust={dados_evento.get('xJust', 'Operacao nao realizada')}")
    
    if tpEvento == "110111": # Cancelamento
        # O orgao para cancelamento é a UF da nota (geralmente extraída da chave)
        uf_nota = dados_evento['chNFe'][:2]
        ini_linhas[4] = f"cOrgao={uf_nota}" 
        ini_linhas.append(f"xJust={dados_evento.get('xJust', 'Erro de Emissao')}")
        ini_linhas.append("nProt=123456789012345") # TODO: Exigir nProt na rota para cancelamento de emissao
        
    if tpEvento == "110110": # Carta de Correcao
        uf_nota = dados_evento['chNFe'][:2]
        ini_linhas[4] = f"cOrgao={uf_nota}" 
        ini_linhas.append(f"xCorrecao={dados_evento.get('xCorrecao', 'Correcao de dados')}")
        ini_linhas.append("xCondUso=A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.")

    evento_ini = "\n".join(ini_linhas)
    
    acbr.limpar_lista_eventos()
    acbr.carregar_evento_ini(evento_ini)
    
    ret, resp_str = acbr.enviar_evento(1)
    
    try:
        resp_json = json.loads(resp_str)
        # Tentar salvar no banco a manifestacao atual se houver sucesso
        if db and tpEvento in ["210200", "210210", "210220", "210240"]:
            from app.models import NotaFiscal
            nota = db.query(NotaFiscal).filter(NotaFiscal.chave_acesso == dados_evento['chNFe']).first()
            if nota:
                nota.manifestacao_atual = tpEvento
                db.commit()
                
        return {"retorno": ret, "resposta": resp_json}
    except:
        return {"retorno": ret, "resposta": resp_str}

@router.post("/ciencia_operacao")
def ciencia_operacao(request: Request, data: EventoCiencia, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "210210", db=db)
    finally:
        acbr.finalizar()

@router.post("/confirmacao_operacao")
def confirmacao_operacao(request: Request, data: EventoConfirmacao, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "210200", db=db)
    finally:
        acbr.finalizar()

@router.post("/desconhecimento_operacao")
def desconhecimento_operacao(request: Request, data: EventoDesconhecimento, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "210220", db=db)
    finally:
        acbr.finalizar()

@router.post("/operacao_nao_realizada")
def operacao_nao_realizada(request: Request, data: EventoOperacaoNaoRealizada, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "210240", db=db)
    finally:
        acbr.finalizar()

@router.post("/cancelamento")
def cancelamento(request: Request, data: EventoCancelamento, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "110111", db=db)
    finally:
        acbr.finalizar()

@router.post("/carta_correcao")
def carta_correcao(request: Request, data: EventoCartaCorrecao, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.tenant_cnpj != data.cnpj:
        raise HTTPException(status_code=403, detail="Acesso negado")
    tenant, acbr = get_tenant_and_acbr(data.cnpj, db)
    try:
        return montar_enviar_evento(data.model_dump(), acbr, tenant, "110110", db=db)
    finally:
        acbr.finalizar()
