'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { formatCNPJ, formatDate, isCertificateExpired } from '@/lib/types'
import {
  Upload,
  Eye,
  EyeOff,
  FileKey,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react'

export function CertificateForm() {
  const router = useRouter()
  const { user, config, setConfig } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    ambiente: config?.ambiente?.toString() || '1',
    senha_certificado: '',
    ult_nsu: config?.ult_nsu || '0',
    email: config?.email || user?.email || '',
    telefone: config?.telefone || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isExpired = config?.certificado_vencimento
    ? isCertificateExpired(config.certificado_vencimento)
    : false

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedFile && !config) {
      newErrors.file = 'Selecione o arquivo do certificado (.pfx)'
    }

    if (!formData.senha_certificado && (!config || selectedFile)) {
      newErrors.senha_certificado = 'Senha do certificado é obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.pfx')) {
        toast.error('Selecione um arquivo .pfx válido')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB.')
        return
      }
      setSelectedFile(file)
      if (errors.file) {
        setErrors((prev) => ({ ...prev, file: '' }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return
    if (!user?.tenant_cnpj) {
      toast.error('CNPJ não encontrado')
      return
    }

    setIsLoading(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('cnpj', user.tenant_cnpj)
      formDataToSend.append('ambiente', formData.ambiente)
      formDataToSend.append('ult_nsu', formData.ult_nsu)
      
      if (formData.email) {
        formDataToSend.append('email', formData.email)
      }
      if (formData.telefone) {
        formDataToSend.append('telefone', formData.telefone)
      }

      if (selectedFile) {
        formDataToSend.append('certificado', selectedFile)
        formDataToSend.append('senha_certificado', formData.senha_certificado)
      }

      const response = await api.saveConfig(formDataToSend)
      // A API retorna { message, tenant } — extraímos o tenant
      const newConfig = (response as { tenant?: unknown }).tenant || response
      setConfig(newConfig as import('@/lib/types').TenantConfig)

      toast.success(
        config
          ? 'Configurações atualizadas com sucesso!'
          : 'Certificado configurado com sucesso!'
      )

      // Reset file selection
      setSelectedFile(null)
      setFormData((prev) => ({ ...prev, senha_certificado: '' }))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Redirect to dashboard if first setup
      if (!config) {
        router.push('/dashboard')
      }
    } catch (error) {
      const err = error as { detail?: string; status?: number }
      if (err.detail?.includes('senha') || err.detail?.includes('password')) {
        toast.error('Senha do certificado incorreta')
      } else if (err.detail?.includes('vencido') || err.detail?.includes('expired')) {
        toast.error('Certificado digital vencido. Use um certificado válido.')
      } else {
        toast.error(err.detail || 'Erro ao salvar configurações')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Current certificate status */}
      {config?.certificado_vencimento && (
        <div
          className={`p-4 rounded-lg border ${
            isExpired
              ? 'border-destructive/50 bg-destructive/10'
              : 'border-green-500/50 bg-green-500/10'
          }`}
        >
          <div className="flex items-start gap-3">
            {isExpired ? (
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            <div>
              <p className="font-medium">
                {isExpired ? 'Certificado Expirado' : 'Certificado Ativo'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isExpired ? 'Expirou em' : 'Válido até'}:{' '}
                <strong>{formatDate(config.certificado_vencimento)}</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CNPJ display */}
        <div className="space-y-2">
          <Label>CNPJ da Empresa</Label>
          <Input
            value={user?.tenant_cnpj ? formatCNPJ(user.tenant_cnpj) : ''}
            disabled
            className="bg-secondary/50"
          />
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <Label htmlFor="certificado">
            Certificado Digital A1 (.pfx)
            {config && !isExpired && (
              <span className="text-muted-foreground font-normal ml-2">
                (opcional - só envie para trocar)
              </span>
            )}
          </Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              selectedFile
                ? 'border-primary/50 bg-primary/5'
                : errors.file
                ? 'border-destructive/50 bg-destructive/5'
                : 'border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pfx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isLoading}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileKey className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste o arquivo .pfx
                </p>
              </>
            )}
          </div>
          {errors.file && (
            <p className="text-sm text-destructive">{errors.file}</p>
          )}
        </div>

        {/* Certificate password */}
        {(selectedFile || !config) && (
          <div className="space-y-2">
            <Label htmlFor="senha_certificado">Senha do Certificado</Label>
            <div className="relative">
              <Input
                id="senha_certificado"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite a senha do certificado"
                value={formData.senha_certificado}
                onChange={(e) => handleChange('senha_certificado', e.target.value)}
                className={`pr-10 ${
                  errors.senha_certificado ? 'border-destructive' : ''
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.senha_certificado && (
              <p className="text-sm text-destructive">{errors.senha_certificado}</p>
            )}
          </div>
        )}

        {/* Environment */}
        <div className="space-y-2">
          <Label htmlFor="ambiente">Ambiente</Label>
          <Select
            value={formData.ambiente}
            onValueChange={(value) => handleChange('ambiente', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o ambiente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Produção</SelectItem>
              <SelectItem value="2">Homologação (Testes)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* NSU */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="ult_nsu">Último NSU</Label>
            <div className="group relative">
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all text-sm">
                <p>
                  Deixe 0 para buscar todas as notas. Se já usou outro sistema,
                  informe o último NSU para continuar de onde parou.
                </p>
              </div>
            </div>
          </div>
          <Input
            id="ult_nsu"
            type="text"
            placeholder="0"
            value={formData.ult_nsu}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '')
              handleChange('ult_nsu', value)
            }}
            disabled={isLoading}
          />
        </div>

        {/* Contact info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail de contato (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="contato@empresa.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full glow"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Salvando...
            </>
          ) : config ? (
            'Salvar Configurações'
          ) : (
            'Configurar Certificado'
          )}
        </Button>
      </form>
    </div>
  )
}
