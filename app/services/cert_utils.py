import os
import re
from datetime import datetime, timezone
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography import x509
from cryptography.x509.oid import NameOID

def extrair_cnpj(certificate) -> str:
    """
    Tenta extrair o CNPJ do certificado (Subject ou SAN).
    Retorna apenas os 14 dígitos ou None se não encontrar.
    """
    # 1. Tenta no Serial Number do Subject (Padrão ICP-Brasil para e-CNPJ)
    serial_attrs = certificate.subject.get_attributes_for_oid(NameOID.SERIAL_NUMBER)
    for attr in serial_attrs:
        val = str(attr.value)
        digits = "".join(filter(str.isdigit, val))
        if len(digits) == 14:
            return digits

    # 2. Tenta no Common Name do Subject (Muitas vezes contém "NOME:CNPJ")
    cn_attrs = certificate.subject.get_attributes_for_oid(NameOID.COMMON_NAME)
    for attr in cn_attrs:
        val = str(attr.value)
        match = re.search(r'(\d{14})', val)
        if match:
            return match.group(1)

    # 3. Tenta no Subject Alternative Name (SAN)
    try:
        san = certificate.extensions.get_extension_for_class(x509.SubjectAlternativeName)
        for name in san.value:
            # Em ICP-Brasil, o CNPJ costuma estar no OtherName (OID 2.16.76.1.3.3)
            # Como o parsing do OtherName é complexo, buscamos 14 dígitos em qualquer campo de texto
            if isinstance(name, (x509.DNSName, x509.RFC822Name, x509.UniformResourceIdentifier)):
                match = re.search(r'(\d{14})', name.value)
                if match:
                    return match.group(1)
            elif isinstance(name, x509.OtherName):
                # OID CNPJ = 2.16.76.1.3.3
                if name.type_id.dotted_string == "2.16.76.1.3.3":
                    # Tenta extrair da representação em bytes do valor ASN.1
                    match = re.search(rb'(\d{14})', name.value)
                    if match:
                        return match.group(1).decode('ascii')
    except x509.ExtensionNotFound:
        pass

    return None

def validar_certificado(pfx_data: bytes, senha: str, cnpj_esperado: str = None):
    """
    Tenta abrir o certificado PFX com a senha informada.
    Verifica se está vencido e se o CNPJ coincide (se informado).
    Retorna (valido: bool, mensagem: str, data_vencimento: datetime)
    """
    try:
        # A lib cryptography exige a senha em bytes
        senha_bytes = senha.encode('utf-8')
        
        # Tenta carregar as credenciais
        private_key, certificate, additional_certificates = pkcs12.load_key_and_certificates(
            pfx_data,
            senha_bytes
        )
        
        if certificate is None:
            return False, "O arquivo não contém um certificado válido.", None

        # 1. Verificar Data de Vencimento
        # Usando not_valid_after_utc para compatibilidade com cryptography moderna
        try:
            data_vencimento = certificate.not_valid_after_utc
        except AttributeError:
            # Fallback para versões mais antigas
            data_vencimento = certificate.not_valid_after
            if data_vencimento.tzinfo is None:
                data_vencimento = data_vencimento.replace(tzinfo=timezone.utc)

        agora = datetime.now(timezone.utc)
        if data_vencimento < agora:
            vencimento_str = data_vencimento.strftime('%d/%m/%Y %H:%M:%S')
            return False, f"O certificado está vencido desde {vencimento_str}.", data_vencimento

        # 2. Verificar CNPJ (se informado)
        if cnpj_esperado:
            cnpj_certificado = extrair_cnpj(certificate)
            cnpj_limpo_esperado = "".join(filter(str.isdigit, cnpj_esperado))
            
            if not cnpj_certificado:
                # Opcional: Permitir se não conseguir extrair? 
                # Usuário pediu que SEJA do mesmo cnpj, então se não encontrarmos, melhor avisar.
                return False, "Não foi possível extrair o CNPJ do certificado para validação.", data_vencimento
            
            if cnpj_certificado != cnpj_limpo_esperado:
                return False, f"O CNPJ do certificado ({cnpj_certificado}) não coincide com o CNPJ informado ({cnpj_limpo_esperado}).", data_vencimento

        return True, "Certificado validado com sucesso", data_vencimento

    except ValueError as e:
        return False, f"Senha incorreta ou arquivo PFX inválido: {str(e)}", None
    except Exception as e:
        return False, f"Erro ao processar certificado: {str(e)}", None
