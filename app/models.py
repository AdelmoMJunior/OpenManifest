from sqlalchemy import Column, String, Integer, Boolean, Text, ForeignKey, DateTime, Float, LargeBinary
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    is_verified = Column(Boolean, default=False)
    tenant_cnpj = Column(String(14), ForeignKey("tenants.cnpj"))
    
    tenant = relationship("Tenant", back_populates="users")
    sessions = relationship("Session", back_populates="user")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    jti = Column(String(255), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="sessions")

class Tenant(Base):
    __tablename__ = "tenants"

    cnpj = Column(String(14), primary_key=True, index=True)
    razao_social = Column(String(150), nullable=True)
    nome_fantasia = Column(String(150), nullable=True)
    
    inscricao_estadual = Column(String(20), nullable=True)
    is_ie_ativa = Column(Boolean, default=True)

    logradouro = Column(String(150), nullable=True)
    numero = Column(String(20), nullable=True)
    complemento = Column(String(100), nullable=True)
    bairro = Column(String(100), nullable=True)
    cep = Column(String(8), nullable=True)
    codigo_municipio = Column(String(10), nullable=True)
    nome_municipio = Column(String(100), nullable=True)
    uf = Column(String(2), nullable=True)

    email = Column(String(100), nullable=True)
    telefone = Column(String(20), nullable=True)

    # 1 - Homologacao, 0 - Producao
    ambiente = Column(Integer, default=1)
    
    certificado_blob = Column(LargeBinary, nullable=True)
    certificado_senha = Column(String(100), nullable=True)

    # Parametros para controle de Distribuicao
    ult_nsu = Column(String(15), default="0")
    data_ultima_consulta_nsu = Column(DateTime, nullable=True)
    certificado_vencimento = Column(DateTime, nullable=True)

    users = relationship("User", back_populates="tenant")
    selos = relationship("Selo", back_populates="tenant")
    notas = relationship("NotaFiscal", back_populates="tenant")


class Selo(Base):
    __tablename__ = "selos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tenant_cnpj = Column(String(14), ForeignKey("tenants.cnpj"))
    nome = Column(String(50))
    cor_hex = Column(String(7), nullable=True) # Ex: #FF0000
    
    tenant = relationship("Tenant", back_populates="selos")
    notas = relationship("NotaFiscal", back_populates="selo")


class NotaFiscal(Base):
    __tablename__ = "notas_fiscais"
    chave_acesso = Column(String(44), primary_key=True, index=True)
    tenant_cnpj = Column(String(14), ForeignKey("tenants.cnpj"))
    nsu = Column(String(15), nullable=True)
    
    emitente_cnpj = Column(String(14), nullable=True)
    emitente_nome = Column(String(150), nullable=True)
    data_emissao = Column(DateTime, nullable=True)
    valor_total = Column(Float, nullable=True)
    
    # Se False, eh apenas um Resumo. Se True, eh a Nota Completa
    is_completa = Column(Boolean, default=False)
    xml_url = Column(String(2000), nullable=True) # URL publica no S3/B2
    manifestacao_atual = Column(String(50), nullable=True) # Ex: 210210, 210200
    
    selo_id = Column(Integer, ForeignKey("selos.id"), nullable=True)
    
    tenant = relationship("Tenant", back_populates="notas")
    selo = relationship("Selo", back_populates="notas")
    eventos = relationship("NotaEvento", back_populates="nota")


class NotaEvento(Base):
    __tablename__ = "nota_eventos"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    chave_nota = Column(String(44), ForeignKey("notas_fiscais.chave_acesso"))
    nsu = Column(String(15), nullable=True)
    tipo_evento = Column(String(50), nullable=True) # Descricao do evento
    data_evento = Column(DateTime, default=datetime.utcnow)
    xml_url = Column(String(2000), nullable=True)
    
    nota = relationship("NotaFiscal", back_populates="eventos")

