import asyncio
import logging
import concurrent.futures
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Tenant
from app.services.distribuicao_service import sincronizar_tenant_nsu

logger = logging.getLogger(__name__)

# Pool de Executores (Máximo de CNPJs sincronizados simultaneamente neste contêiner)
MAX_WORKERS = 10 

def _sync_single_tenant(cnpj: str):
    """
    Função envelopadora (wrapper) para rodar a sincronização síncrona
    dentro da thread isolada.
    """
    db = SessionLocal()
    try:
        sucesso, _, nsu, msg = sincronizar_tenant_nsu(cnpj, db)
        if sucesso:
            logger.info(f"[WORKER] Tenant {cnpj} sincronizado. Novo NSU: {nsu}.")
        else:
            logger.info(f"[WORKER] Tenant {cnpj} pulado/erro: {msg}")
    except Exception as e:
        logger.error(f"[WORKER] Erro grave ao sincronizar {cnpj}: {e}")
    finally:
        db.close()

async def job_sincronizar_todos():
    """
    Job que varre o banco, seleciona Tenants elegíveis e os joga no ThreadPool.
    """
    db = SessionLocal()
    try:
        tenants = db.query(Tenant).all()
        elegiveis = []
        
        for t in tenants:
            if not t.certificado_blob:
                continue # Pula se não tiver certificado configurado
                
            if t.certificado_vencimento and t.certificado_vencimento < datetime.utcnow():
                logger.warning(f"[WORKER] Certificado vencido para o Tenant {t.cnpj}. Pulando.")
                continue
                
            # Elegível se data_ultima_consulta_nsu for None (nunca rodou) 
            # ou se passou 1 hora da ultima consulta
            if not t.data_ultima_consulta_nsu:
                elegiveis.append(t.cnpj)
            else:
                tempo_passado = datetime.utcnow() - t.data_ultima_consulta_nsu
                if tempo_passado >= timedelta(hours=1):
                    elegiveis.append(t.cnpj)
                    
        if not elegiveis:
            logger.info("[WORKER] Nenhum Tenant elegível para sincronização neste momento.")
            return

        logger.info(f"[WORKER] {len(elegiveis)} Tenants elegíveis. Iniciando pool de threads...")
        
        # Execução paralela sem bloquear o Event Loop da API
        loop = asyncio.get_running_loop()
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as pool:
            tasks = [
                loop.run_in_executor(pool, _sync_single_tenant, cnpj) 
                for cnpj in elegiveis
            ]
            await asyncio.gather(*tasks)
            
        logger.info("[WORKER] Lote de sincronização finalizado.")
        
    except Exception as e:
        logger.error(f"[WORKER] Erro no job_sincronizar_todos: {e}")
    finally:
        db.close()

async def run_worker_loop():
    """
    Loop infinito que acorda a cada X minutos para rodar o job.
    """
    logger.info("[WORKER] Background Worker Iniciado! Rodando a cada 10 minutos.")
    while True:
        try:
            await job_sincronizar_todos()
        except Exception as e:
            logger.error(f"[WORKER] Falha crítica no loop principal: {e}")
            
        # Dorme por 10 minutos (600 segundos) antes da próxima varredura
        await asyncio.sleep(600)
