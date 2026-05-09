import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form'

export const metadata: Metadata = {
  title: 'Esqueci Minha Senha',
  description: 'Recupere o acesso à sua conta OpenManifest.',
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Esqueceu a senha?"
      subtitle="Não se preocupe, vamos ajudá-lo a recuperar o acesso"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
