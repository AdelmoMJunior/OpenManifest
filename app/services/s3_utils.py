import os
import boto3
from botocore.config import Config

class S3B2Client:
    def __init__(self):
        self.endpoint = os.environ.get("B2_ENDPOINT_URL")
        self.access_key = os.environ.get("B2_ACCESS_KEY_ID")
        self.secret_key = os.environ.get("B2_SECRET_ACCESS_KEY")
        self.bucket = os.environ.get("B2_BUCKET_NAME")
        self.cdn_url = os.environ.get("B2_PUBLIC_CDN_URL", "").rstrip("/")
        
        if self.endpoint and not self.endpoint.startswith("http"):
            self.endpoint = f"https://{self.endpoint}"
            
        if self.endpoint and self.access_key and self.secret_key:
            self.s3 = boto3.client(
                's3',
                endpoint_url=self.endpoint,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key,
                config=Config(signature_version='s3v4')
            )
        else:
            self.s3 = None

    def upload_xml_bytes(self, file_bytes: bytes, s3_key: str) -> str:
        if not self.s3:
            print(f"B2 não configurado. Ignorando upload de {s3_key}")
            return None
            
        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_bytes,
                ContentType='application/xml'
            )
            # Retorna a chave (path) para ser salva no banco
            return s3_key
        except Exception as e:
            print(f"Erro ao subir arquivo pro B2: {e}")
            return None

    def generate_download_url(self, object_key: str, expire_seconds: int = 3600, filename: str = None):
        """
        Gera pre-signed URL S3 para download direto do B2.
        Usa o endpoint S3 real (não o CDN), igual ao projeto ams-bkp que funciona.
        """
        if not self.s3:
            return None
        try:
            params = {
                'Bucket': self.bucket,
                'Key': object_key,
            }
            
            # Forçar download em vez de abrir no navegador
            if filename:
                if not filename.endswith(".xml"): filename += ".xml"
                params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'

            url = self.s3.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expire_seconds
            )
            return url
            
        except Exception as e:
            print(f"Erro ao gerar URL nativa final: {e}")
            return None

    def get_cdn_url(self, object_key: str):
        return f"{self.cdn_url}/{object_key}"

s3_client = S3B2Client()
