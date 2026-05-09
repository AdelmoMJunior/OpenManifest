import type { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CertificateForm } from '@/components/dashboard/certificate-form'

export const metadata: Metadata = {
  title: 'Certificado Digital',
  description: 'Configure seu certificado digital A1 para comunicação com a SEFAZ.',
}

export default function CertificatePage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Certificado Digital</h1>
        <p className="text-muted-foreground">
          Configure seu certificado A1 (.pfx) para comunicação segura com a SEFAZ
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuração do Certificado</CardTitle>
          <CardDescription>
            O certificado digital é necessário para buscar suas notas fiscais na SEFAZ.
            Use um certificado A1 válido no formato .pfx.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CertificateForm />
        </CardContent>
      </Card>
    </div>
  )
}
