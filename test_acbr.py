import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.services.distribuicao_service import get_tenant_and_acbr

def main():
    db = SessionLocal()
    try:
        tenant, acbr = get_tenant_and_acbr("05783085000145", db)
        print("ACBr inicializado")
        try:
            ret, msg = acbr.status_servico()
            print("Status Servico:", ret, msg)
        except Exception as e:
            print("Erro:", e)
        finally:
            pass
    finally:
        db.close()

if __name__ == "__main__":
    main()
