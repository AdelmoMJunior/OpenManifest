import type { Metadata } from 'next'
import { AuthLayout } from '@/components/auth/auth-layout'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = {
  title: 'Criar Conta',
  description: 'Crie sua conta gratuita no OpenManifest e comece a gerenciar suas notas fiscais.',
}

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Criar conta gratuita"
      subtitle="Cadastre-se para começar a gerenciar suas NF-e"
    >
      <RegisterForm />
    </AuthLayout>
  )
}
