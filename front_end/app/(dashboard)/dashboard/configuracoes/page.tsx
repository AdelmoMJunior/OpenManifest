'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import { formatCNPJ, formatDate, PASSWORD_MIN_LENGTH } from '@/lib/types'
import { Eye, EyeOff, User, Mail, Building2, Calendar } from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})

  const validatePasswords = () => {
    const errors: Record<string, string> = {}

    if (!passwords.current) {
      errors.current = 'Senha atual é obrigatória'
    }

    if (!passwords.new) {
      errors.new = 'Nova senha é obrigatória'
    } else if (passwords.new.length < PASSWORD_MIN_LENGTH) {
      errors.new = `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwords.new)) {
      errors.new = 'Use maiúsculas, minúsculas e números'
    }

    if (passwords.new !== passwords.confirm) {
      errors.confirm = 'As senhas não coincidem'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validatePasswords()) return

    setIsChangingPassword(true)

    try {
      await api.changePassword(passwords.current, passwords.new)
      toast.success('Senha alterada com sucesso!')
      setPasswords({ current: '', new: '', confirm: '' })
    } catch (error) {
      const err = error as { detail?: string; status?: number }
      if (err.status === 400) {
        toast.error('Senha atual incorreta')
      } else {
        toast.error(err.detail || 'Erro ao alterar senha')
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta e preferências
        </p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
          <CardDescription>
            Dados cadastrais da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome
              </Label>
              <Input value={user?.full_name || ''} disabled className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                E-mail
              </Label>
              <Input value={user?.email || ''} disabled className="bg-secondary/50" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                CNPJ
              </Label>
              <Input
                value={user?.tenant_cnpj ? formatCNPJ(user.tenant_cnpj) : ''}
                disabled
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Membro desde
              </Label>
              <Input
                value={user?.created_at ? formatDate(user.created_at) : ''}
                disabled
                className="bg-secondary/50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle>Alterar Senha</CardTitle>
          <CardDescription>
            Mantenha sua conta segura com uma senha forte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Senha atual</Label>
              <div className="relative">
                <Input
                  id="current"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.current}
                  onChange={(e) => {
                    setPasswords((p) => ({ ...p, current: e.target.value }))
                    if (passwordErrors.current) {
                      setPasswordErrors((e) => ({ ...e, current: '' }))
                    }
                  }}
                  className={passwordErrors.current ? 'border-destructive' : ''}
                  disabled={isChangingPassword}
                />
              </div>
              {passwordErrors.current && (
                <p className="text-sm text-destructive">{passwordErrors.current}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.new}
                  onChange={(e) => {
                    setPasswords((p) => ({ ...p, new: e.target.value }))
                    if (passwordErrors.new) {
                      setPasswordErrors((e) => ({ ...e, new: '' }))
                    }
                  }}
                  className={`pr-10 ${passwordErrors.new ? 'border-destructive' : ''}`}
                  disabled={isChangingPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordErrors.new && (
                <p className="text-sm text-destructive">{passwordErrors.new}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type={showPasswords ? 'text' : 'password'}
                value={passwords.confirm}
                onChange={(e) => {
                  setPasswords((p) => ({ ...p, confirm: e.target.value }))
                  if (passwordErrors.confirm) {
                    setPasswordErrors((e) => ({ ...e, confirm: '' }))
                  }
                }}
                className={passwordErrors.confirm ? 'border-destructive' : ''}
                disabled={isChangingPassword}
              />
              {passwordErrors.confirm && (
                <p className="text-sm text-destructive">{passwordErrors.confirm}</p>
              )}
            </div>

            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Alterando...
                </>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
