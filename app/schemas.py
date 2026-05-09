from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class TenantBase(BaseModel):
    cnpj: str
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    inscricao_estadual: Optional[str] = None
    is_ie_ativa: Optional[bool] = None
    email: Optional[str] = None
    telefone: Optional[str] = None
    ambiente: Optional[int] = 1
    ult_nsu: Optional[str] = "0"

class TenantOut(TenantBase):
    class Config:
        from_attributes = True

class ConsultaDistribuicaoBase(BaseModel):
    cnpj: str
    uf: str

class DistribuicaoChave(ConsultaDistribuicaoBase):
    chave: str

class DistribuicaoNSU(ConsultaDistribuicaoBase):
    nsu: str

# Para Ultimo NSU, usamos apenas o cnpj e uf, pois ele puxa o ult_nsu do banco
class DistribuicaoUltNSU(ConsultaDistribuicaoBase):
    pass

class EventoBase(BaseModel):
    cnpj: str
    chNFe: str
    
class EventoCancelamento(EventoBase):
    xJust: str

class EventoCartaCorrecao(EventoBase):
    xCorrecao: str

class EventoConfirmacao(EventoBase):
    pass

class EventoCiencia(EventoBase):
    pass

class EventoDesconhecimento(EventoBase):
    pass

class EventoOperacaoNaoRealizada(EventoBase):
    xJust: str

class EnviarNotaBase(BaseModel):
    cnpj: str
    conteudo_ini: str  # Pode ser INI ou XML
    modelo: int = 55 # 55=NFe, 65=NFCe

class SeloBase(BaseModel):
    nome: str
    cor_hex: Optional[str] = None

class SeloCreate(SeloBase):
    pass

class SeloOut(SeloBase):
    id: int
    tenant_cnpj: str
    class Config:
        from_attributes = True

class NotaEventoOut(BaseModel):
    id: int
    nsu: Optional[str] = None
    tipo_evento: Optional[str] = None
    data_evento: Optional[datetime] = None
    xml_conteudo: Optional[str] = None
    class Config:
        from_attributes = True

class NotaFiscalOut(BaseModel):
    chave_acesso: str
    nsu: Optional[str] = None
    emitente_cnpj: Optional[str] = None
    emitente_nome: Optional[str] = None
    emitente_razao_social: Optional[str] = None  # Alias para emitente_nome
    numero: Optional[str] = None
    serie: Optional[str] = None
    data_emissao: Optional[datetime] = None
    valor_total: Optional[float] = None
    is_completa: bool
    xml_url: Optional[str] = None
    manifestacao_atual: Optional[str] = None
    manifestacao: Optional[str] = None  # Alias para manifestacao_atual
    selo_id: Optional[int] = None
    selo: Optional[SeloOut] = None
    eventos: List[NotaEventoOut] = []
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_with_aliases(cls, obj):
        """Popula os aliases a partir dos campos do model"""
        data = cls.model_validate(obj)
        data.emitente_razao_social = data.emitente_nome
        
        # Mapeamento do código da manifestação
        map_manifestacao = {
            "210210": "ciencia_operacao",
            "210200": "confirmacao_operacao",
            "210220": "desconhecimento_operacao",
            "210240": "operacao_nao_realizada"
        }
        
        # Manifestação
        if data.manifestacao_atual in map_manifestacao:
            data.manifestacao = map_manifestacao[data.manifestacao_atual]
        else:
            data.manifestacao = "sem_manifestacao"
            
        # Número e Série da Chave de Acesso (posições 22 a 25 para série, 25 a 34 para número)
        if data.chave_acesso and len(data.chave_acesso) == 44:
            data.serie = str(int(data.chave_acesso[22:25]))  # Remove zeros à esquerda
            data.numero = str(int(data.chave_acesso[25:34])) # Remove zeros à esquerda
            
        return data

class PaginatedNotas(BaseModel):
    total: int
    page: int
    limit: int
    items: List[NotaFiscalOut]
