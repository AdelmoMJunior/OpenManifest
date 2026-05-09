import json
import logging
from datetime import datetime, date, timedelta
from sqlalchemy import func
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import NotaFiscal, Selo, User
from app.schemas import NotaFiscalOut
from app.services.distribuicao_service import get_tenant_and_acbr
from app.routers.eventos import montar_enviar_evento
from app.dependencies import get_current_user

router = APIRouter(prefix="/api/notas", tags=["Notas Recebidas"])
logger = logging.getLogger(__name__)

from typing import List, Optional
from fastapi import Query
from app.schemas import PaginatedNotas, NotaFiscalOut

@router.get("/{cnpj}", response_model=PaginatedNotas)
def listar_notas(
    request: Request,
    cnpj: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    emitente_cnpj: Optional[str] = None,
    selo_id: Optional[int] = None,
    manifestacao: Optional[str] = None,
    is_completa: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Acesso negado")
        
    query = db.query(NotaFiscal).filter(NotaFiscal.tenant_cnpj == cnpj_limpo)
    
    if data_inicio:
        query = query.filter(NotaFiscal.data_emissao >= data_inicio)
    if data_fim:
        query = query.filter(NotaFiscal.data_emissao <= data_fim)
    if emitente_cnpj:
        query = query.filter(NotaFiscal.emitente_cnpj == "".join(filter(str.isdigit, emitente_cnpj)))
    if selo_id is not None:
        query = query.filter(NotaFiscal.selo_id == selo_id)
    if manifestacao and manifestacao != "all":
        if manifestacao == "sem_manifestacao":
            query = query.filter((NotaFiscal.manifestacao_atual == None) | (NotaFiscal.manifestacao_atual == ""))
        else:
            map_manifestacao_reverse = {
                "ciencia_operacao": "210210",
                "confirmacao_operacao": "210200",
                "desconhecimento_operacao": "210220",
                "operacao_nao_realizada": "210240"
            }
            codigo = map_manifestacao_reverse.get(manifestacao)
            if codigo:
                query = query.filter(NotaFiscal.manifestacao_atual == codigo)
    if is_completa is not None:
        query = query.filter(NotaFiscal.is_completa == is_completa)
        
    
    # Ordenar pelas mais recentes por padrão
    query = query.order_by(NotaFiscal.data_emissao.desc())
    
    total = query.count()
    offset = (page - 1) * limit
    notas = query.offset(offset).limit(limit).all()
    
    # Converter para schema com aliases
    items = [NotaFiscalOut.from_orm_with_aliases(n) for n in notas]
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.get("/{cnpj}/stats")
def dashboard_stats(cnpj: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cnpj_limpo = "".join(filter(str.isdigit, cnpj))
    if current_user.tenant_cnpj != cnpj_limpo:
        raise HTTPException(status_code=403, detail="Acesso negado")

    today = date.today()
    first_day_current = datetime(today.year, today.month, 1)
    
    # Mês passado
    last_month_date = first_day_current - timedelta(days=1)
    first_day_last = datetime(last_month_date.year, last_month_date.month, 1)
    last_day_last = first_day_current - timedelta(seconds=1)

    total_notas = db.query(NotaFiscal).filter(NotaFiscal.tenant_cnpj == cnpj_limpo).count()
    pendentes = db.query(NotaFiscal).filter(
        NotaFiscal.tenant_cnpj == cnpj_limpo,
        (NotaFiscal.manifestacao_atual == None) | (NotaFiscal.manifestacao_atual == "")
    ).count()
    completas = db.query(NotaFiscal).filter(
        NotaFiscal.tenant_cnpj == cnpj_limpo,
        NotaFiscal.is_completa == True
    ).count()

    valor_mes_atual = db.query(func.sum(NotaFiscal.valor_total)).filter(
        NotaFiscal.tenant_cnpj == cnpj_limpo,
        NotaFiscal.data_emissao >= first_day_current
    ).scalar() or 0.0

    valor_mes_passado = db.query(func.sum(NotaFiscal.valor_total)).filter(
        NotaFiscal.tenant_cnpj == cnpj_limpo,
        NotaFiscal.data_emissao >= first_day_last,
        NotaFiscal.data_emissao <= last_day_last
    ).scalar() or 0.0

    diff_percent = 0.0
    if valor_mes_passado > 0:
        diff_percent = ((valor_mes_atual - valor_mes_passado) / valor_mes_passado) * 100

    return {
        "total": total_notas,
        "pendentes": pendentes,
        "completas": completas,
        "valor_mes_atual": round(valor_mes_atual, 2),
        "valor_mes_passado": round(valor_mes_passado, 2),
        "diferenca_percentual": round(diff_percent, 2)
    }

@router.put("/{chave_acesso}/selo")
def alterar_selo_nota(request: Request, chave_acesso: str, selo_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    nota = db.query(NotaFiscal).filter(NotaFiscal.chave_acesso == chave_acesso).first()
    if not nota or nota.tenant_cnpj != current_user.tenant_cnpj:
        raise HTTPException(status_code=404, detail="Nota Fiscal não encontrada")
        
    selo = db.query(Selo).filter(Selo.id == selo_id).first()
    if not selo:
        raise HTTPException(status_code=404, detail="Selo não encontrado")
        
    nota.selo_id = selo.id
    db.commit()
    return {"message": "Selo atualizado com sucesso"}

@router.get("/{chave_acesso}/xml")
def baixar_xml_nota(request: Request, chave_acesso: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi.responses import Response
    import requests as http_requests
    
    nota = db.query(NotaFiscal).filter(NotaFiscal.chave_acesso == chave_acesso).first()
    if not nota or nota.tenant_cnpj != current_user.tenant_cnpj:
        raise HTTPException(status_code=404, detail="Nota Fiscal não encontrada")
        
    if nota.is_completa and nota.xml_url:
        from app.services.s3_utils import s3_client
        
        # Gera pre-signed URL para o S3
        url = nota.xml_url
        if not url.startswith("http"):
            url = s3_client.generate_download_url(url)
        
        if not url:
            raise HTTPException(status_code=500, detail="Erro ao gerar URL de download")
        
        # Baixa o XML do S3 e entrega como proxy
        r = http_requests.get(url, timeout=30)
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail="Erro ao baixar XML do armazenamento")
        
        filename = f"{chave_acesso}.xml"
        return Response(
            content=r.content,
            media_type="application/xml",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Type": "application/xml; charset=utf-8",
            }
        )
        
    # Se nao for completa, faz o evento de confirmacao e busca a completa
    from app.services.distribuicao_service import salvar_documento_distribuicao
    tenant, acbr = get_tenant_and_acbr(nota.tenant_cnpj, db)
    try:
        # Enviar Confirmacao de Operacao (tpEvento=210200)
        dados_evento = {"chNFe": chave_acesso}
        montar_enviar_evento(dados_evento, acbr, tenant, "210200")
        
        # Agora busca por chave para pegar a Completa, com loop de tentativas (pois a SEFAZ não disponibiliza instantaneamente)
        import time
        max_tentativas = 5
        for tentativa in range(max_tentativas):
            ret, resp_str = acbr.distribuicao_por_chave(tenant.uf, tenant.cnpj, chave_acesso)
            try:
                resp = json.loads(resp_str)
                dist_resp = resp.get("DistribuicaoDFe", {})
                lote = dist_resp.get("loteDistDFeInt", [])
                if not isinstance(lote, list): lote = []
                
                # Buscar por chaves individuais (ResDFe001, ProcDFe001, etc)
                for k, v in dist_resp.items():
                    if any(k.startswith(p) for p in ["ResDFe", "ProcDFe", "docZip"]):
                        if isinstance(v, dict) and v not in lote:
                            lote.append(v)

                # PROCESSAR DOCUMENTOS PRIMEIRO
                for doc in lote:
                    sch = doc.get("schema", doc.get("Schema", ""))
                    xml_cont = doc.get("xml", doc.get("XML", doc.get("conteudo", "")))
                    if "procNFe" in sch or "nfeProc" in str(xml_cont):
                        logger.info(f"[BAIXAR {chave_acesso}] XML Completo localizado!")
                        salvar_documento_distribuicao(tenant.cnpj, db, doc)
                        db.commit()
                        db.refresh(nota)
                        
                        if nota.is_completa and nota.xml_url:
                            from app.services.s3_utils import s3_client
                            r = s3_client.get_xml(nota.xml_url)
                            if r:
                                return Response(
                                    content=r.content,
                                    media_type="application/xml",
                                    headers={"Content-Disposition": f'attachment; filename="{chave_acesso}.xml"'}
                                )

                # VERIFICAR BLOQUEIOS DE CONSUMO
                if "Consumo Indevido" in resp_str or dist_resp.get("CStat") == 656:
                    logger.warning(f"[BAIXAR {chave_acesso}] Consumo indevido (656). Aguardando {tentativa+1}/{max_tentativas}...")
                    time.sleep(3)
                    continue

            except Exception as e:
                logger.error(f"[BAIXAR {chave_acesso}] Erro: {str(e)}")
                pass
            
            time.sleep(2)
            
        raise HTTPException(status_code=400, detail="A SEFAZ ainda não disponibilizou o XML completo. Tente novamente em instantes.")
    finally:
        acbr.finalizar()
