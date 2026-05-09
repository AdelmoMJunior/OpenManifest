'use client'

import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/lib/store'
import {
  isCertificateExpired,
  isCertificateExpiringSoon,
  getDaysUntilExpiration,
} from '@/lib/types'
import { AlertTriangle, Shield, X } from 'lucide-react'
import { useState } from 'react'

export function CertificateAlert() {
  const { config } = useAuthStore()
  const [isDismissed, setIsDismissed] = useState(false)

  // No config means onboarding needed
  if (!config) {
    return (
      <Alert className="border-primary/50 bg-primary/10 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <AlertTitle className="text-primary font-semibold">
          Configure seu certificado digital
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-foreground/80 mb-3">
            Para começar a receber suas notas fiscais, você precisa enviar o certificado
            digital A1 (.pfx) da sua empresa.
          </p>
          <Link href="/dashboard/certificado">
            <Button size="sm" className="glow-sm">
              Enviar Certificado
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  if (!config.certificado_vencimento) return null

  const isExpired = isCertificateExpired(config.certificado_vencimento)
  const isExpiringSoon = isCertificateExpiringSoon(config.certificado_vencimento, 30)
  const daysUntil = getDaysUntilExpiration(config.certificado_vencimento)

  // Certificate expired - CRITICAL
  if (isExpired) {
    return (
      <Alert variant="destructive" className="mb-6 border-2">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="font-bold text-lg">
          Certificado Digital Expirado!
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm mb-3">
            Seu certificado digital expirou. O sistema <strong>parou de buscar novas notas</strong>.
            Envie um novo certificado para continuar utilizando o OpenManifest.
          </p>
          <Link href="/dashboard/certificado">
            <Button variant="destructive" size="sm">
              Atualizar Certificado Agora
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  // Certificate expiring soon - WARNING
  if (isExpiringSoon && !isDismissed) {
    return (
      <Alert className="border-warning/50 bg-warning/10 mb-6 relative">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 hover:bg-warning/20 rounded transition-colors"
          aria-label="Dispensar alerta"
        >
          <X className="h-4 w-4 text-warning" />
        </button>
        <AlertTriangle className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning font-semibold">
          Certificado expira em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
        </AlertTitle>
        <AlertDescription className="mt-2">
          <p className="text-sm text-foreground/80 mb-3">
            Seu certificado digital está próximo do vencimento. Recomendamos atualizar
            antes que expire para evitar interrupções.
          </p>
          <Link href="/dashboard/certificado">
            <Button variant="outline" size="sm" className="border-warning/50 text-warning hover:bg-warning/10">
              Atualizar Certificado
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
