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
import { useAuthStore } from '@/lib/store'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const { setUser, setLoading: setAuthLoading } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'E-mail é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido'
    }
    
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    setAuthLoading(true)
    
    try {
      await api.login(formData.email, formData.password)
      const user = await api.getMe()
      setUser(user)
      toast.success('Login realizado com sucesso!')
      router.push('/dashboard')
    } catch (error) {
      const err = error as { detail?: string; status?: number }
      if (err.status === 401) {
        toast.error('E-mail ou senha incorretos')
      } else if (err.status === 403) {
        toast.error('E-mail não verificado', {
          description: 'Verifique sua caixa de entrada para ativar a conta.',
          duration: 8000,
        })
      } else if (err.status === 400) {
        toast.error('Dados inválidos', {
          description: err.detail || 'Verifique os dados informados.',
        })
      } else {
        toast.error(err.detail || 'Erro ao fazer login')
      }
    } finally {
      setIsLoading(false)
      setAuthLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Sua senha"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
            disabled={isLoading}
            autoComplete="current-password"
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

      {/* Submit */}
      <Button type="submit" className="w-full glow" disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Entrando...
          </>
        ) : (
          'Entrar'
        )}
      </Button>

      {/* Register link */}
      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/register" className="text-primary hover:underline font-medium">
          Criar conta grátis
        </Link>
      </p>
    </form>
  )
}
