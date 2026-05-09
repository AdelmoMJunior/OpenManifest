import json
import tempfile
import os
import base64
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Tenant, NotaFiscal, NotaEvento
from app.services.acbr import ACBrLibNFeMT
from app.services.s3_utils import s3_client
from app.services.auth import redis_client

logger = logging.getLogger(__name__)

def get_tenant_and_acbr(cnpj: str, db: Session):
    tenant = db.query(Tenant).filter(Tenant.cnpj == cnpj).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant não configurado")
        
    temp_cert_path = None
    if tenant.certificado_blob:
        fd, temp_cert_path = tempfile.mkstemp(prefix=f"{cnpj}_", suffix=".pfx")
        with os.fdopen(fd, 'wb') as f:
            f.write(tenant.certificado_blob)
        setattr(tenant, "certificado_temp_path", temp_cert_path)
    
    acbr = ACBrLibNFeMT()
    acbr.inicializar(tenant)
    return tenant, acbr

import gzip
import io

def salvar_documento_distribuicao(tenant_cnpj: str, db: Session, doc: dict):
    schema = doc.get("schema", "")
    nsu = str(doc.get("NSU", doc.get("nsu", "")))
    
    # Extrair conteúdo (pode vir como docZip, conteudo, xml ou XML)
    xml_b64 = doc.get("docZip", doc.get("conteudo", doc.get("xml", doc.get("XML", ""))))
    xml_bytes = b""
    if xml_b64:
        try:
            # docZip da SEFAZ é Base64 -> GZip -> XML
            compressed_data = base64.b64decode(xml_b64)
            with gzip.GzipFile(fileobj=io.BytesIO(compressed_data)) as f:
                xml_bytes = f.read()
        except:
            # Se falhar o gzip, tenta base64 direto
            try:
                xml_bytes = base64.b64decode(xml_b64)
            except:
                xml_bytes = xml_b64 if isinstance(xml_b64, bytes) else xml_b64.encode("utf-8")

    # Se não temos chave no dicionário, tentamos extrair do XML descompactado
    chave = doc.get("chNFe", doc.get("chDFe", doc.get("chave", "")))
    cnpj_emit = doc.get("CNPJ", doc.get("CNPJCPF", ""))
    nome_emit = doc.get("xNome", "")
    valor_total = doc.get("vNF", None)
    data_emi = doc.get("dhEmi", doc.get("dhRecbto", ""))

    if xml_bytes:
        try:
            import re
            xml_str = xml_bytes.decode("utf-8", errors="replace")
            # Extrair chave do XML se ainda não tivermos
            if not chave:
                # Tenta vários padrões de chave
                match_ch = re.search(r'chNFe>(\d{44})<', xml_str)
                if not match_ch: match_ch = re.search(r'Id="NFe(\d{44})"', xml_str)
                if not match_ch: match_ch = re.search(r'chNFe="(\d{44})"', xml_str)
                if match_ch: chave = match_ch.group(1)
            # Extrair CNPJ
            if not cnpj_emit:
                match_cnpj = re.search(r'CNPJ>(\d+)<', xml_str)
                if not match_cnpj: match_cnpj = re.search(r'CNPJCPF>(\d+)<', xml_str)
                if match_cnpj: cnpj_emit = match_cnpj.group(1)
            # Extrair Nome
            if not nome_emit:
                match_nome = re.search(r'xNome>([^<]+)<', xml_str)
                if match_nome: nome_emit = match_nome.group(1)
            # Extrair Valor
            if valor_total is None:
                match_v = re.search(r'vNF>([^<]+)<', xml_str)
                if match_v: valor_total = match_v.group(1)
            # Extrair Data
            if not data_emi:
                match_d = re.search(r'dhEmi>([^<]+)<', xml_str)
                if not match_d: match_d = re.search(r'dhRecbto>([^<]+)<', xml_str)
                if match_d: data_emi = match_d.group(1)
        except Exception as e:
            logger.error(f"Erro ao extrair dados do XML NSU {nsu}: {e}")

    if not chave:
        logger.warning(f"Documento NSU {nsu} ignorado: Chave de acesso não encontrada.")
        return
        
    xml_url = None
    if xml_bytes:
        data_atual = datetime.utcnow().strftime("%Y%m")
        # Só sobe pro S3 se for Nota Completa ou Evento
        # Uma nota é completa se contiver a tag <nfeProc ou <infNFe e NÃO for resNFe
        is_completa = ("nfeProc" in xml_str or "infNFe" in xml_str) and "resNFe" not in xml_str
        
        logger.info(f"[SAVE {chave}] NSU={nsu} Schema={schema} IsCompleta={is_completa}")
        
        if is_completa:
            s3_key = f"{tenant_cnpj}/{data_atual}/nfe/{chave}.xml"
            xml_url = s3_client.upload_xml_bytes(xml_bytes, s3_key)
            logger.info(f"[SAVE {chave}] Upload NFe Completa para S3: {xml_url}")
        elif "Evento" in schema:
            tipo_evento = doc.get("xEvento", "Evento").replace(" ", "")
            s3_key = f"{tenant_cnpj}/{data_atual}/eventos/{chave}_{tipo_evento}_{nsu}.xml"
            xml_url = s3_client.upload_xml_bytes(xml_bytes, s3_key)
            logger.info(f"[SAVE {chave}] Upload Evento para S3: {xml_url}")

    if "NFe" in schema and "Evento" not in schema:
        # Recalcular is_completa para a lógica de banco
        is_completa = ("nfeProc" in xml_str or "infNFe" in xml_str) and "resNFe" not in xml_str
        
        nota = db.query(NotaFiscal).filter(NotaFiscal.chave_acesso == chave).first()
        if not nota:
            nota = NotaFiscal(chave_acesso=chave, tenant_cnpj=tenant_cnpj)
            db.add(nota)
            db.flush() # Evitar duplicados no mesmo lote
            
        nota.nsu = nsu
        nota.emitente_cnpj = cnpj_emit
        nota.emitente_nome = nome_emit
        if valor_total:
            try: nota.valor_total = float(valor_total)
            except: pass
        
        if data_emi:
            try:
                nota.data_emissao = datetime.fromisoformat(data_emi[:19])
            except:
                pass
                
        if is_completa or not nota.is_completa:
            nota.is_completa = is_completa
            if xml_url:
                nota.xml_url = xml_url
                logger.info(f"[SAVE {chave}] Nota atualizada no banco com XML_URL.")
            
    elif "Evento" in schema:
        evento = db.query(NotaEvento).filter(NotaEvento.chave_nota == chave, NotaEvento.nsu == nsu).first()
        tp_evento = doc.get("xEvento", "Evento")
        if not evento:
            evento = NotaEvento(
                chave_nota=chave,
                nsu=nsu,
                tipo_evento=tp_evento,
                xml_url=xml_url
            )
            nota_pai = db.query(NotaFiscal).filter(NotaFiscal.chave_acesso == chave).first()
            if not nota_pai:
                nota_pai = NotaFiscal(chave_acesso=chave, tenant_cnpj=tenant_cnpj, is_completa=False)
                db.add(nota_pai)
                
            cod_evento = doc.get("tpEvento", "")
            if cod_evento in ["210200", "210210", "210220", "210240"]:
                nota_pai.manifestacao_atual = cod_evento
                
            db.add(evento)

def sincronizar_tenant_nsu(cnpj: str, db: Session, bypass_hora_lock: bool = False):
    """
    Executa a sincronização de NSU para um Tenant específico.
    Usado tanto pela Rota Manual quanto pelo Background Worker.
    Retorna (status, eventos_coletados, nsu_atual, mensagem_erro)
    """
    tenant_db = db.query(Tenant).filter(Tenant.cnpj == cnpj).first()
    if not tenant_db:
        return False, [], "0", "Tenant não encontrado"
        
    uf = tenant_db.uf or "SP"
    
    # Verificar Vencimento do Certificado
    if tenant_db.certificado_vencimento and tenant_db.certificado_vencimento < datetime.utcnow():
        return False, [], tenant_db.ult_nsu, "Certificado digital expirado. Por favor, atualize o certificado nas configurações."

    # Verificar Trava de 1 Hora da SEFAZ
    if tenant_db.data_ultima_consulta_nsu and not bypass_hora_lock:
        tempo_passado = datetime.utcnow() - tenant_db.data_ultima_consulta_nsu
        if tempo_passado < timedelta(hours=1):
            minutos_restantes = 60 - int(tempo_passado.total_seconds() / 60)
            return False, [], tenant_db.ult_nsu, f"Regra da SEFAZ: Aguarde {minutos_restantes} minutos para não sofrer Rejeição."

    # Criar Lock de 15 Minutos no Redis
    lock_key = f"nsu_lock_{cnpj}"
    if redis_client:
        adquiriu_lock = redis_client.set(lock_key, "1", nx=True, ex=900)
        if not adquiriu_lock:
            return False, [], tenant_db.ult_nsu, "Sincronização já está em andamento para este CNPJ."

    eventos_coletados = []
    
    try:
        tenant, acbr = get_tenant_and_acbr(cnpj, db)
    except Exception as e:
        if redis_client:
            redis_client.delete(lock_key)
        return False, [], "0", f"Erro ao inicializar ACBr: {str(e)}"
        
    try:
        import xml.etree.ElementTree as ET
        import xml.etree.ElementTree as ET
        import glob
        
        while True:
            logger.info(f"[SYNC {cnpj}] Consultando ultNSU={tenant.ult_nsu} UF={uf}")
            ret, resp_str = acbr.distribuicao_por_ult_nsu(uf, cnpj, tenant.ult_nsu)
            
            logger.info(f"[SYNC {cnpj}] Retorno ACBr (ret={ret})")
            
            # --- LÓGICA DE EXTRAÇÃO DE DADOS (JSON OU XML FAIL-SAFE) ---
            cStat = 0
            xMotivo = ""
            ultNSU = ""
            maxNSU = ""
            docs_data = []

            # Tentar via JSON primeiro
            try:
                resp_json = json.loads(resp_str)
                dist_resp = resp_json.get("DistribuicaoDFe", {})
                status = resp_json.get("Retorno", dist_resp)
                cStat = int(status.get("cStat", status.get("CStat", 0)))
                xMotivo = status.get("xMotivo", status.get("XMotivo", ""))
                ultNSU = status.get("ultNSU", status.get("ultNSU", ""))
                maxNSU = status.get("maxNSU", status.get("maxNSU", ""))
                
                # Coletar documentos: pode vir em loteDistDFeInt ou como chaves individuais ResDFeXXX, ProcDFeXXX
                lote = dist_resp.get("loteDistDFeInt", [])
                if not isinstance(lote, list): lote = []
                
                # Buscar por chaves individuais se o lote estiver vazio ou para complementar
                for k, v in dist_resp.items():
                    if any(k.startswith(p) for p in ["ResDFe", "ProcDFe", "docZip", "DocDFe"]):
                        if isinstance(v, dict) and v not in lote:
                            lote.append(v)

                for doc in lote:
                    # ACBrLib pode usar 'schema' ou 'schema' (case insensitive em alguns lugares)
                    sch = doc.get("schema", doc.get("Schema", ""))
                    nsu_val = doc.get("NSU", doc.get("nsu", ""))
                    # Conteúdo pode estar em 'conteudo', 'docZip' ou 'XML'
                    cont = doc.get("conteudo", doc.get("docZip", doc.get("xml", doc.get("XML", ""))))
                    
                    if nsu_val and cont:
                        docs_data.append({
                            "schema": sch,
                            "NSU": nsu_val,
                            "conteudo": cont
                        })
            except:
                pass

            # FAIL-SAFE: Se cStat for 0 ou lote vazio mas ret=0, ler do arquivo XML gerado
            if cStat == 0:
                logger.info(f"[SYNC {cnpj}] cStat=0 no JSON. Tentando fail-safe via arquivo XML...")
                data_dir = f"/app/acbr_data/{cnpj}"
                files = glob.glob(f"{data_dir}/*-dist-dfe.xml")
                if files:
                    latest_file = max(files, key=os.path.getmtime)
                    try:
                        with open(latest_file, 'r', encoding='utf-8') as f:
                            xml_content = f.read()
                            # Remover namespaces
                            import re
                            xml_clean = re.sub(' xmlns="[^"]+"', '', xml_content, count=1)
                            root = ET.fromstring(xml_clean)
                            
                            cStat = int(root.findtext('cStat') or 0)
                            xMotivo = root.findtext('xMotivo') or ""
                            ultNSU = root.findtext('ultNSU') or ""
                            maxNSU = root.findtext('maxNSU') or ""
                            
                            lote_el = root.find('loteDistDFeInt')
                            if lote_el is not None:
                                for doc_el in lote_el.findall('docZip'):
                                    docs_data.append({
                                        "schema": doc_el.get("schema", ""),
                                        "NSU": doc_el.get("NSU", ""),
                                        "conteudo": doc_el.text
                                    })
                        logger.info(f"[SYNC {cnpj}] Fail-safe XML funcionou! cStat extraído: {cStat}")
                    except Exception as e:
                        logger.error(f"[SYNC {cnpj}] Falha no fail-safe XML: {e}")

            logger.info(f"[SYNC {cnpj}] cStat={cStat} xMotivo={xMotivo} ultNSU={ultNSU} maxNSU={maxNSU}")
            
            # Atualizar ult_nsu no banco se recebido
            if ultNSU and ultNSU != tenant.ult_nsu:
                tenant.ult_nsu = str(int(ultNSU)) # Garantir formato string numérica
                db.commit()

            if cStat not in [137, 138]:
                logger.info(f"[SYNC {cnpj}] Parando sincronização (cStat={cStat}). Motivo: {xMotivo}")
                tenant.data_ultima_consulta_nsu = datetime.utcnow()
                db.commit()
                break
            
            if docs_data:
                logger.info(f"[SYNC {cnpj}] Lote com {len(docs_data)} documentos")
                for doc in docs_data:
                    salvar_documento_distribuicao(tenant.cnpj, db, doc)
                db.commit()
            
            if cStat == 137: 
                logger.info(f"[SYNC {cnpj}] Sem mais documentos (137).")
                tenant.data_ultima_consulta_nsu = datetime.utcnow()
                db.commit()
                break
            
            if ultNSU:
                tenant.ult_nsu = str(ultNSU)
                db.commit()
                
            if not ultNSU or not maxNSU or int(ultNSU) >= int(maxNSU):
                logger.info(f"[SYNC {cnpj}] ultNSU ({ultNSU}) >= maxNSU ({maxNSU}). Fim do lote.")
                tenant.data_ultima_consulta_nsu = datetime.utcnow()
                db.commit()
                break

        return True, eventos_coletados, tenant.ult_nsu, "Sincronização concluída com sucesso."
    finally:
        if redis_client:
            redis_client.delete(lock_key)
        if 'acbr' in locals():
            acbr.finalizar()
