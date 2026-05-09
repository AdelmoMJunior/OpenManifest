import requests

def buscar_dados_cnpj(cnpj: str):
    cnpj = "".join(filter(str.isdigit, cnpj))
    url = f"https://publica.cnpj.ws/cnpj/{cnpj}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            
            # Buscar a Inscrição Estadual (IE) ativa, se houver
            ie_ativa = None
            for insc in data.get("inscricoes_estaduais", []):
                if insc.get("ativo"):
                    ie_ativa = insc.get("inscricao_estadual")
                    break
            
            # Extrair dados principais
            estab = data.get("estabelecimento", {})
            cidade = estab.get("cidade", {})
            estado = estab.get("estado", {})
            
            return {
                "razao_social": data.get("razao_social"),
                "nome_fantasia": estab.get("nome_fantasia") or data.get("razao_social"),
                "inscricao_estadual": ie_ativa,
                "is_ie_ativa": ie_ativa is not None,
                "logradouro": estab.get("logradouro"),
                "numero": estab.get("numero"),
                "complemento": estab.get("complemento"),
                "bairro": estab.get("bairro"),
                "cep": estab.get("cep"),
                "codigo_municipio": cidade.get("ibge_id"),
                "nome_municipio": cidade.get("nome"),
                "uf": estado.get("sigla"),
                "email": estab.get("email"),
                "telefone": f"{estab.get('ddd1', '')}{estab.get('telefone1', '')}"
            }
        return None
    except Exception as e:
        print(f"Erro ao buscar CNPJ {cnpj}: {e}")
        return None
