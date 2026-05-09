from app.database import SessionLocal
from app.models import NotaFiscal
from app.services.s3_utils import s3_client

db = SessionLocal()
nota = db.query(NotaFiscal).filter(NotaFiscal.xml_url != None).first()
if nota:
    url = s3_client.generate_download_url(nota.xml_url)
    direct_url = url.replace("https://files2.kaisoft.com.br", "https://f005.backblazeb2.com")
    print(f"Link Nativo Direto (B2): {direct_url}")
else:
    print("Nenhuma nota com XML")
db.close()
