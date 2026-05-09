"""
Teste final: gera 2 links para comparar CDN vs Direto
"""
import boto3
from botocore.config import Config
import os

access_key = os.environ.get("B2_ACCESS_KEY_ID")
secret_key = os.environ.get("B2_SECRET_ACCESS_KEY")
bucket = os.environ.get("B2_BUCKET_NAME")
cdn_url = os.environ.get("B2_PUBLIC_CDN_URL")
s3_endpoint = os.environ.get("B2_ENDPOINT_URL")

# Buscar uma nota para testar
from app.database import SessionLocal
from app.models import NotaFiscal
db = SessionLocal()
nota = db.query(NotaFiscal).filter(NotaFiscal.xml_url != None).first()
if not nota:
    print("Nenhuma nota com XML encontrada")
    exit()

object_key = nota.xml_url
print(f"Object Key: {object_key}")
print(f"CDN URL: {cdn_url}")
print(f"S3 Endpoint: {s3_endpoint}")
print("---")

# Link 1: Direto pelo S3 (sem CDN) - Igual ao seu outro projeto
s3_direct = boto3.client('s3',
    endpoint_url=s3_endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    config=Config(signature_version='s3v4')
)
url_direto = s3_direct.generate_presigned_url(
    'get_object',
    Params={'Bucket': bucket, 'Key': object_key, 'ResponseContentDisposition': 'attachment'},
    ExpiresIn=3600
)
print(f"LINK 1 (S3 Direto - funciona igual seu outro projeto):")
print(url_direto)
print()

# Link 2: Pelo CDN
s3_cdn = boto3.client('s3',
    endpoint_url=cdn_url,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    config=Config(signature_version='s3v4')
)
url_cdn = s3_cdn.generate_presigned_url(
    'get_object',
    Params={'Bucket': bucket, 'Key': object_key, 'ResponseContentDisposition': 'attachment'},
    ExpiresIn=3600
)
print(f"LINK 2 (Via CDN - so funciona se CNAME apontar para S3 endpoint):")
print(url_cdn)

db.close()
