import os
from cryptography.hazmat.primitives.serialization import pkcs12

def validar_certificado(pfx_data: bytes, senha: str):
    """
    Tenta abrir o certificado PFX com a senha informada.
    Retorna True se for válido, False caso contrário.
    Pode retornar os detalhes do certificado futuramente.
    """
    try:
        # A lib cryptography exige a senha em bytes
        senha_bytes = senha.encode('utf-8')
        
        # Tenta carregar as credenciais (lança ValueError se a senha for errada ou o PFX inválido)
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            pfx_data,
            senha_bytes
        )
        
        if certificate is None:
            return False, "O arquivo não contém um certificado válido.", None

        data_vencimento = certificate.not_valid_after
        return True, "Certificado validado com sucesso", data_vencimento

    except ValueError as e:
        return False, f"Senha incorreta ou arquivo PFX inválido: {str(e)}", None
    except Exception as e:
        return False, f"Erro ao processar certificado: {str(e)}", None
