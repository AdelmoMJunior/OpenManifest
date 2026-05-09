'use client'

import { motion } from 'framer-motion'
import { LandingHeader } from '@/components/landing/header'
import { Footer } from '@/components/landing/footer'
import { FileText, ShieldCheck, Scale } from 'lucide-react'

export default function TermosPage() {
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
                <Scale className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold">Termos de Uso</h1>
            </div>

            <section className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50 text-foreground">
                <p className="font-medium">Última atualização: 09 de Maio de 2026</p>
                <p className="text-sm mt-2 opacity-70">Por favor, leia estes termos cuidadosamente antes de usar o OpenManifest.</p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
                  1. Aceitação dos Termos
                </h2>
                <p>
                  Ao acessar e utilizar a plataforma OpenManifest, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">2. Descrição do Serviço</h2>
                <p>
                  O OpenManifest é uma ferramenta de código aberto destinada à visualização, download e manifestação de Notas Fiscais Eletrônicas (NF-e) emitidas contra o CNPJ do usuário, através da integração com os webservices da SEFAZ.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">3. Responsabilidade do Usuário</h2>
                <p>
                  O usuário é o único responsável por:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A guarda e sigilo de suas credenciais de acesso e certificado digital.</li>
                  <li>A veracidade das informações fornecidas para a configuração da conta.</li>
                  <li>As ações de manifestação (Ciência, Confirmação, Desconhecimento) realizadas na plataforma, que possuem valor legal perante o fisco.</li>
                </ul>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">4. Limitação de Responsabilidade</h2>
                <p>
                  O OpenManifest é fornecido "como está", sem garantias de qualquer tipo. Não nos responsabilizamos por indisponibilidades dos serviços da SEFAZ, erros de processamento originados por certificados inválidos ou mau uso da ferramenta.
                </p>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground">5. Licença Open Source</h2>
                <p>
                  Esta plataforma é distribuída sob a Licença MIT. Você tem a liberdade de usar, copiar, modificar e distribuir o software, desde que mantenha os avisos de copyright originais conforme exigido pela licença.
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
