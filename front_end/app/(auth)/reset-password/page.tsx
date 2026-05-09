import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import { Spinner } from '@/components/ui/spinner'

export const metadata: Metadata = {
  title: 'Redefinir Senha',
  description: 'Defina uma nova senha para sua conta OpenManifest.',
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Redefinir senha"
      subtitle="Escolha uma nova senha segura para sua conta"
    >
      <Suspense fallback={<div className="flex justify-center py-8"><Spinner /></div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  )
}
