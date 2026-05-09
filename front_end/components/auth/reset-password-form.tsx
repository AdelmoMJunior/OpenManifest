'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { PASSWORD_MIN_LENGTH } from '@/lib/types'
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react'

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
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
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      toast.error('Link inválido. Solicite um novo link de recuperação.')
      return
    }
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      await api.resetPassword(token, formData.password)
      setIsSuccess(true)
      toast.success('Senha redefinida com sucesso!')
    } catch (error) {
      const err = error as { detail?: string; status?: number }
      if (err.status === 400) {
        toast.error('Link expirado ou inválido. Solicite um novo.')
      } else {
        toast.error(err.detail || 'Erro ao redefinir senha')
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

  if (!token) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-destructive">Link inválido</h2>
        <p className="text-muted-foreground mb-6">
          O link de recuperação é inválido ou expirou. Solicite um novo link.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full">Solicitar novo link</Button>
        </Link>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Senha redefinida!</h2>
        <p className="text-muted-foreground mb-6">
          Sua senha foi alterada com sucesso. Você já pode fazer login.
        </p>
        <Link href="/login">
          <Button className="w-full glow">Fazer login</Button>
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-muted-foreground">
        Digite sua nova senha. Use pelo menos 8 caracteres com maiúsculas, minúsculas e números.
      </p>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
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
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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

      {/* Submit */}
      <Button type="submit" className="w-full glow" disabled={isLoading}>
        {isLoading ? (
          <>
            <Spinner className="mr-2 h-4 w-4" />
            Redefinindo...
          </>
        ) : (
          'Redefinir senha'
        )}
      </Button>
    </form>
  )
}
