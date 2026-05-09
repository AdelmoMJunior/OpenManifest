'use client'

import { motion } from 'framer-motion'
import { LandingHeader } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { ShieldCheck, Lock, EyeOff } from 'lucide-react'

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Política de Privacidade</h1>
            </div>

            <section className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50 text-foreground">
                <p className="font-medium">Última atualização: 09 de Maio de 2026</p>
                <p className="text-sm mt-2 opacity-70">Sua privacidade e a segurança dos seus dados fiscais são nossa prioridade absoluta.</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  1. Coleta de Dados
                </h2>
                <p>
                  Coletamos apenas as informações estritamente necessárias para o funcionamento do serviço:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Dados de cadastro (Nome, Email, CNPJ).</li>
                  <li>Certificado Digital (armazenado de forma segura para comunicação com a SEFAZ).</li>
                  <li>Metadados das Notas Fiscais (extraídos diretamente da SEFAZ sob sua autorização).</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  2. Segurança do Certificado Digital
                </h2>
                <p>
                  Entendemos a sensibilidade do Certificado Digital (.pfx). Na nossa plataforma:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Os certificados são criptografados em repouso.</li>
                  <li>As senhas nunca são exibidas em texto claro após o salvamento.</li>
                  <li>Utilizamos protocolos HTTPS de alta segurança para qualquer transferência de dados.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  3. Uso das Informações
                </h2>
                <p>
                  Seus dados fiscais pertencem a você. O OpenManifest não compartilha, vende ou utiliza suas informações de faturamento para qualquer finalidade que não seja a exibição e gestão dentro da sua própria conta.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">4. Cookies e Rastreamento</h2>
                <p>
                  Utilizamos cookies técnicos apenas para manter sua sessão ativa e garantir sua segurança durante a navegação. Não utilizamos cookies de rastreamento para fins publicitários de terceiros.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
                <p>
                  Em conformidade com a LGPD, você tem o direito de acessar, corrigir ou excluir seus dados a qualquer momento. A exclusão da conta resultará na remoção permanente de todos os seus dados e certificados de nossos servidores.
                </p>
              </div>
            </section>
          </motion.div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
