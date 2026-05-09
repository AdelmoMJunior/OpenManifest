'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { CheckCircle, XCircle, FileText } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error')
        setError('Token de verificação não encontrado.')
        return
      }

      try {
        await api.verifyEmail(token)
        setStatus('success')
      } catch (err) {
        setStatus('error')
        const error = err as { detail?: string; status?: number }
        if (error.status === 400) {
          setError('Link de verificação inválido ou expirado.')
        } else {
          setError('Erro ao verificar e-mail. Tente novamente.')
        }
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="max-w-md w-full text-center">
      {/* Logo */}
      <Link href="/" className="inline-flex items-center gap-2 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 glow-sm">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <span className="text-2xl font-bold">
          Open<span className="gradient-text">Manifest</span>
        </span>
      </Link>

      {status === 'loading' && (
        <div className="py-12">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando seu e-mail...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto mb-6">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">E-mail verificado!</h1>
          <p className="text-muted-foreground mb-8">
            Sua conta foi ativada com sucesso. Você já pode fazer login.
          </p>
          <Link href="/login">
            <Button className="glow">Fazer login</Button>
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mx-auto mb-6">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Erro na verificação</h1>
          <p className="text-muted-foreground mb-8">{error}</p>
          <div className="space-y-3">
            <Link href="/login">
              <Button variant="outline" className="w-full">
                Ir para o login
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-center py-12"><Spinner className="h-12 w-12 mx-auto mb-4" /><p className="text-muted-foreground">Carregando verificação...</p></div>}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
