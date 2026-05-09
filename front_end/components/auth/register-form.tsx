'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { validateCNPJ, PASSWORD_MIN_LENGTH } from '@/lib/types'
import { Eye, EyeOff, Mail, Lock, User, Building2 } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenant_cnpj: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const formatCNPJInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome é obrigatório'
    } else if (formData.full_name.trim().length < 3) {
      newErrors.full_name = 'Nome deve ter pelo menos 3 caracteres'
    }
    
    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    } else if (formData.password.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter maiúscula, minúscula e número'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem'
    }
    
    const cleanCNPJ = formData.tenant_cnpj.replace(/\D/g, '')
    if (!cleanCNPJ) {
      newErrors.tenant_cnpj = 'CNPJ é obrigatório'
    } else if (!validateCNPJ(cleanCNPJ)) {
      newErrors.tenant_cnpj = 'CNPJ inválido'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      await api.register({
        full_name: formData.full_name.trim(),
        email: formData.email,
        password: formData.password,
        tenant_cnpj: formData.tenant_cnpj.replace(/\D/g, ''),
      })
      
      toast.success('Conta criada! Verifique seu e-mail para ativar.', {
        duration: 5000,
      })
      router.push('/login?registered=true')
    } catch (error) {
      const err = error as { detail?: string; status?: number }
      if (err.status === 400) {
        if (err.detail?.includes('email')) {
          toast.error('Este e-mail já está cadastrado')
        } else if (err.detail?.includes('cnpj')) {
          toast.error('Este CNPJ já está cadastrado')
        } else if (err.detail?.includes('senha') || err.detail?.includes('password')) {
          toast.error('Senha muito fraca. Use maiúsculas, minúsculas e números.')
        } else {
          toast.error(err.detail || 'Erro ao criar conta')
        }
      } else {
        toast.error('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    if (field === 'tenant_cnpj') {
      value = formatCNPJInput(value)
    }
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="full_name">Nome completo</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="full_name"
            type="text"
            placeholder="Seu nome"
            value={formData.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
            className={`pl-10 ${errors.full_name ? 'border-destructive' : ''}`}
            disabled={isLoading}
            autoComplete="name"
          />
        </div>
        {errors.full_name && (
          <p className="text-sm text-destructive">{errors.full_name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      {/* CNPJ */}
      <div className="space-y-2">
        <Label htmlFor="tenant_cnpj">CNPJ da Empresa</Label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="tenant_cnpj"
            type="text"
            placeholder="00.000.000/0000-00"
            value={formData.tenant_cnpj}
            onChange={(e) => handleChange('tenant_cnpj', e.target.value)}
            className={`pl-10 ${errors.tenant_cnpj ? 'border-destructive' : ''}`}
            disabled={isLoading}
            maxLength={18}
          />
        </div>
        {errors.tenant_cnpj && (
          <p className="text-sm text-destructive">{errors.tenant_cnpj}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
            disabled={isLoading}
            autoComplete="new-password"
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
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repita a senha"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            className={`pl-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Terms */}
      <p className="text-xs text-muted-foreground">
        Ao criar uma conta, você concorda com nossos{' '}
        <Link href="/termos" className="text-primary hover:underline">
          Termos de Uso
        </Link>{' '}
        e{' '}
        <Link href="/privacidade" className="text-primary hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      {/* Submit */}
      <Button type="submit" className="w-full glow" disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Criando conta...
          </>
        ) : (
          'Criar conta grátis'
        )}
      </Button>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{' '}
        <Link href="/login" className="text-primary hover:underline font-medium">
          Fazer login
        </Link>
      </p>
    </form>
  )
}
