"""Teste real de download pelo servidor para confirmar que o link funciona"""
import requests
from app.database import SessionLocal
from app.models import NotaFiscal
from app.services.s3_utils import s3_client

db = SessionLocal()
nota = db.query(NotaFiscal).filter(NotaFiscal.xml_url != None).first()
url = s3_client.generate_download_url(nota.xml_url, filename=nota.chave_acesso)

print(f"URL gerada: {url[:80]}...")
r = requests.get(url, timeout=15)
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('Content-Type')}")
print(f"Content-Disposition: {r.headers.get('Content-Disposition')}")
print(f"Tamanho: {len(r.content)} bytes")
if r.status_code == 200:
    print(f"Primeiros 200 chars: {r.text[:200]}")
else:
    print(f"Erro: {r.text}")
db.close()
