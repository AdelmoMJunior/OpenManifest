// User & Auth Types
export interface User {
  id: string
  email: string
  full_name: string
  tenant_cnpj: string
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
}

export interface RegisterData {
  email: string
  password: string
  tenant_cnpj: string
  full_name: string
}

export interface LoginData {
  username: string
  password: string
}

// Config Types
export interface TenantConfig {
  cnpj: string
  razao_social?: string
  nome_fantasia?: string
  uf?: string
  ambiente: 1 | 2
  certificado_vencimento?: string | null
  email?: string
  telefone?: string
  ult_nsu: string
  tem_certificado: boolean
  data_ultima_consulta_nsu?: string | null
}

export interface ConfigFormData {
  cnpj: string
  ambiente: 1 | 2
  senha_certificado: string
  ult_nsu: string
  email?: string
  telefone?: string
  certificado: File
}

// Nota Fiscal Types
export type ManifestacaoStatus = 
  | 'sem_manifestacao'
  | 'ciencia_operacao'
  | 'confirmacao_operacao'
  | 'desconhecimento_operacao'
  | 'operacao_nao_realizada'

export interface NotaFiscal {
  chave_acesso: string
  numero: string
  serie: string
  emitente_cnpj: string
  emitente_razao_social: string
  valor_total: number
  data_emissao: string
  data_inclusao: string
  manifestacao: ManifestacaoStatus
  is_completa: boolean
  selo_id?: number
  xml_url?: string
}

export interface NotasResponse {
  total: number
  page: number
  items: NotaFiscal[]
}

export interface NotasFilters {
  page?: number
  limit?: number
  data_inicio?: string
  data_fim?: string
  emitente_cnpj?: string
  selo_id?: number
  manifestacao?: ManifestacaoStatus
  is_completa?: boolean
}

// Selo (Tag) Types
export interface Selo {
  id: number
  nome: string
  cor: string
}

export const SELOS_PADRAO: Selo[] = [
  { id: 1, nome: 'Pendente', cor: '#fbbf24' },
  { id: 2, nome: 'Processando', cor: '#3b82f6' },
  { id: 3, nome: 'Concluído', cor: '#22c55e' },
  { id: 4, nome: 'Arquivado', cor: '#6b7280' },
  { id: 5, nome: 'Urgente', cor: '#ef4444' },
]

// Distribuição Response
export interface DistribuicaoResponse {
  nsu_atual: string
  eventos: unknown[]
}

// API Error Types
export interface ApiError {
  detail: string
  status?: number
}

// Form validation
export const CNPJ_REGEX = /^\d{14}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_MIN_LENGTH = 8

export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '')
  if (cleanCNPJ.length !== 14) return false
  
  // Verificação básica de CNPJ
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false
  
  // Algoritmo de validação do CNPJ
  let tamanho = cleanCNPJ.length - 2
  let numeros = cleanCNPJ.substring(0, tamanho)
  const digitos = cleanCNPJ.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false
  
  tamanho = tamanho + 1
  numeros = cleanCNPJ.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--
    if (pos < 2) pos = 9
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  return resultado === parseInt(digitos.charAt(1))
}

export function formatCNPJ(cnpj: string): string {
  const clean = cnpj.replace(/\D/g, '')
  return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getManifestacaoLabel(status: ManifestacaoStatus): string {
  const labels: Record<ManifestacaoStatus, string> = {
    sem_manifestacao: 'Sem Manifestação',
    ciencia_operacao: 'Ciência da Operação',
    confirmacao_operacao: 'Confirmação da Operação',
    desconhecimento_operacao: 'Desconhecimento',
    operacao_nao_realizada: 'Operação Não Realizada',
  }
  return labels[status]
}

export function getManifestacaoColor(status: ManifestacaoStatus): string {
  const colors: Record<ManifestacaoStatus, string> = {
    sem_manifestacao: 'bg-muted text-muted-foreground',
    ciencia_operacao: 'bg-blue-500/20 text-blue-400',
    confirmacao_operacao: 'bg-green-500/20 text-green-400',
    desconhecimento_operacao: 'bg-red-500/20 text-red-400',
    operacao_nao_realizada: 'bg-orange-500/20 text-orange-400',
  }
  return colors[status]
}

// Certificate expiration helpers
export function isCertificateExpired(expirationDate: string): boolean {
  return new Date(expirationDate) < new Date()
}

export function isCertificateExpiringSoon(expirationDate: string, days = 30): boolean {
  const expDate = new Date(expirationDate)
  const warningDate = new Date()
  warningDate.setDate(warningDate.getDate() + days)
  return expDate <= warningDate && expDate > new Date()
}

export function getDaysUntilExpiration(expirationDate: string): number {
  const exp = new Date(expirationDate)
  const now = new Date()
  const diff = exp.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}
