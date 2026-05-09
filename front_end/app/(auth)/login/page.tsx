import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { LoginForm } from '@/components/auth/login-form'

export const metadata: Metadata = {
  title: 'Entrar',
  description: 'Faça login na sua conta OpenManifest para gerenciar suas notas fiscais.',
}

export default function LoginPage() {
  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre com suas credenciais para acessar o dashboard"
    >
      <LoginForm />
    </AuthLayout>
  )
}
