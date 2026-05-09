import type {
  AuthResponse,
  User,
  TenantConfig,
  NotasResponse,
  NotasFilters,
  DistribuicaoResponse,
  ApiError,
  ManifestacaoStatus,
} from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Secure token storage - only in memory during session
let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
  if (typeof window !== 'undefined') {
    if (token) {
      // Store in sessionStorage for page refresh persistence (more secure than localStorage)
      sessionStorage.setItem('access_token', token)
    } else {
      sessionStorage.removeItem('access_token')
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('access_token')
    if (stored) {
      accessToken = stored
      return stored
    }
  }
  return null
}

export function clearAuth(): void {
  accessToken = null
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('access_token')
  }
}

// Sanitize input to prevent XSS
function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Validate and sanitize object properties
function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = { ...obj }
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key] as string) as T[Extract<keyof T, string>]
    }
  }
  return sanitized
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requiresAuth = true
  ): Promise<T> {
    const headers: HeadersInit = {
      ...(options.headers || {}),
    }

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      ;(headers as Record<string, string>)['Content-Type'] = 'application/json'
    }

    if (requiresAuth) {
      const token = getAccessToken()
      if (!token) {
        throw new Error('Não autenticado')
      }
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    })

    if (!response.ok) {
      let errorData: ApiError
      try {
        errorData = await response.json()
      } catch {
        errorData = { detail: 'Erro desconhecido', status: response.status }
      }
      
      // Handle specific error codes
      if (response.status === 401 && requiresAuth) {
        // Só redireciona se for uma requisição autenticada que falhou (token expirado)
        // NÃO redireciona se for o próprio login
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
      
      throw { ...errorData, status: response.status }
    }

    // Handle empty responses
    const text = await response.text()
    if (!text) return {} as T
    
    return JSON.parse(text)
  }

  // Auth endpoints
  async register(data: {
    email: string
    password: string
    tenant_cnpj: string
    full_name: string
  }): Promise<{ message: string }> {
    const sanitizedData = sanitizeObject(data)
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    }, false)
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: formData,
    }, false)

    setAccessToken(response.access_token)
    return response
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' })
    } finally {
      clearAuth()
    }
  }

  async getMe(): Promise<User> {
    return this.request('/auth/me')
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: sanitizeString(token) }),
    }, false)
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email: sanitizeString(email) }),
    }, false)
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: sanitizeString(email) }),
    }, false)
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ 
        token: sanitizeString(token), 
        new_password: newPassword 
      }),
    }, false)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        current_password: currentPassword, 
        new_password: newPassword 
      }),
    })
  }

  async changeEmail(newEmail: string, password: string): Promise<{ message: string }> {
    return this.request('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ 
        new_email: sanitizeString(newEmail), 
        password 
      }),
    })
  }

  // Config endpoints
  async getConfig(cnpj: string): Promise<TenantConfig | null> {
    try {
      return await this.request(`/config/${sanitizeString(cnpj.replace(/\D/g, ''))}`)
    } catch (error) {
      if ((error as ApiError).status === 404) {
        return null
      }
      throw error
    }
  }

  async saveConfig(data: FormData): Promise<TenantConfig> {
    return this.request('/config/', {
      method: 'POST',
      body: data,
    })
  }

  // Notas endpoints
  async getNotas(cnpj: string, filters: NotasFilters = {}): Promise<NotasResponse> {
    const params = new URLSearchParams()
    
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.data_inicio) params.append('data_inicio', filters.data_inicio)
    if (filters.data_fim) params.append('data_fim', filters.data_fim)
    if (filters.emitente_cnpj) params.append('emitente_cnpj', filters.emitente_cnpj)
    if (filters.selo_id !== undefined) params.append('selo_id', filters.selo_id.toString())
    if (filters.manifestacao) params.append('manifestacao', filters.manifestacao)
    if (filters.is_completa !== undefined) params.append('is_completa', filters.is_completa.toString())

    const cleanCnpj = cnpj.replace(/\D/g, '')
    const queryString = params.toString()
    return this.request(`/api/notas/${cleanCnpj}${queryString ? `?${queryString}` : ''}`)
  }

  async getDashboardStats(cnpj: string): Promise<{
    total: number
    pendentes: number
    completas: number
    valor_mes_atual: number
    valor_mes_passado: number
    diferenca_percentual: number
  }> {
    return this.request(`/api/notas/${cnpj.replace(/\D/g, '')}/stats`)
  }

  async updateSelo(chaveAcesso: string, seloId: number | null): Promise<void> {
    const params = seloId !== null ? `?selo_id=${seloId}` : ''
    await this.request(`/api/notas/${chaveAcesso}/selo${params}`, {
      method: 'PUT',
    })
  }

  async getXml(chaveAcesso: string): Promise<{ xml_url: string } | string> {
    return this.request(`/api/notas/${chaveAcesso}/xml`)
  }

  // Selos endpoints
  async getSelos(cnpj: string): Promise<Selo[]> {
    return this.request(`/api/selos/${cnpj.replace(/\D/g, '')}`)
  }

  async criarSelo(cnpj: string, data: { nome: string; cor_hex: string }): Promise<Selo> {
    return this.request(`/api/selos/${cnpj.replace(/\D/g, '')}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async atualizarSelo(id: number, data: { nome: string; cor_hex: string }): Promise<Selo> {
    return this.request(`/api/selos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deletarSelo(id: number): Promise<{ message: string }> {
    return this.request(`/api/selos/${id}`, {
      method: 'DELETE',
    })
  }

  // Distribuição endpoints
  async syncNotas(cnpj: string, uf = 'SP'): Promise<DistribuicaoResponse> {
    return this.request('/api/nfe/distribuicao/ult-nsu', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        uf: sanitizeString(uf) 
      }),
    })
  }

  // Manifestação endpoints
  async manifestarCiencia(cnpj: string, chNFe: string): Promise<void> {
    await this.request('/api/nfe/evento/ciencia_operacao', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe) 
      }),
    })
  }

  async manifestarConfirmacao(cnpj: string, chNFe: string): Promise<void> {
    await this.request('/api/nfe/evento/confirmacao_operacao', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe) 
      }),
    })
  }

  async manifestarDesconhecimento(cnpj: string, chNFe: string): Promise<void> {
    await this.request('/api/nfe/evento/desconhecimento_operacao', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe) 
      }),
    })
  }

  async manifestarNaoRealizada(cnpj: string, chNFe: string, justificativa: string): Promise<void> {
    await this.request('/api/nfe/evento/operacao_nao_realizada', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe),
        xJust: sanitizeString(justificativa),
      }),
    })
  }

  async cancelarNota(cnpj: string, chNFe: string, justificativa: string): Promise<void> {
    await this.request('/api/nfe/evento/cancelamento', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe),
        xJust: sanitizeString(justificativa),
      }),
    })
  }

  async cartaCorrecao(cnpj: string, chNFe: string, correcao: string): Promise<void> {
    await this.request('/api/nfe/evento/carta_correcao', {
      method: 'POST',
      body: JSON.stringify({ 
        cnpj: cnpj.replace(/\D/g, ''), 
        chNFe: sanitizeString(chNFe),
        xCorrecao: sanitizeString(correcao),
      }),
    })
  }
}

export const api = new ApiClient(API_BASE_URL)

// SWR fetcher
export const fetcher = async <T>(url: string): Promise<T> => {
  const token = getAccessToken()
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Erro desconhecido' }))
    throw error
  }
  
  return response.json()
}
