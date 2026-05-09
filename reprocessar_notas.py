import os
import sys
import glob
import xml.etree.ElementTree as ET
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Tenant
from app.services.distribuicao_service import salvar_documento_distribuicao

def reprocessar_cnpj(cnpj: str):
    db = SessionLocal()
    try:
        tenant = db.query(Tenant).filter(Tenant.cnpj == cnpj).first()
        if not tenant:
            print(f"Tenant {cnpj} não encontrado.")
            return

        data_dir = f"/app/acbr_data/{cnpj}"
        # Procurar por arquivos de distribuição (que contém o lote de documentos)
        files = glob.glob(os.path.join(data_dir, "*-dist-dfe.xml"))
        print(f"Arquivos encontrados em {data_dir}: {files}")

        count = 0
        for xml_file in sorted(files):
            try:
                print(f"  -> Lendo {os.path.basename(xml_file)}...")
                with open(xml_file, 'r', encoding='utf-8') as f:
                    xml_content = f.read()
                    
                import re
                xml_clean = re.sub(' xmlns="[^"]+"', '', xml_content, count=1)
                root = ET.fromstring(xml_clean)
                
                lote_el = root.find('loteDistDFeInt')
                if lote_el is not None:
                    docs = lote_el.findall('docZip')
                    print(f"  Processando {xml_file} - {len(docs)} documentos...")
                    for doc_el in docs:
                        doc_data = {
                            "schema": doc_el.get("schema", ""),
                            "NSU": doc_el.get("NSU", ""),
                            "conteudo": doc_el.text
                        }
                        salvar_documento_distribuicao(cnpj, db, doc_data)
                        count += 1
                db.commit()
            except Exception as e:
                db.rollback()
                print(f"  Erro ao processar {xml_file}: {e}")
        
        print(f"Concluído! {count} documentos reprocessados para {cnpj}.")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 reprocessar_notas.py <CNPJ>")
    else:
        reprocessar_cnpj(sys.argv[1])
