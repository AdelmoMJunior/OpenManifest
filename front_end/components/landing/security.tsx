'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Shield, Lock, Server, Eye, Key, RefreshCw } from 'lucide-react'

const securityFeatures = [
  {
    icon: Lock,
    title: 'Criptografia de Ponta',
    description:
      'Todas as comunicações são protegidas com TLS 1.3. Seus dados trafegam sempre criptografados.',
  },
  {
    icon: Key,
    title: 'Certificado Protegido',
    description:
      'Seu certificado digital é armazenado de forma segura e nunca compartilhado. Apenas usado para consultas.',
  },
  {
    icon: Server,
    title: 'Infraestrutura Segura',
    description:
      'Servidores isolados com backups automáticos. Monitoramento 24/7 para garantir disponibilidade.',
  },
  {
    icon: Eye,
    title: 'Acesso Restrito',
    description:
      'Cada empresa só acessa seus próprios dados. Autenticação robusta e controle de sessão.',
  },
]

export function SecuritySection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="seguranca" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase">
              Segurança
            </span>
            <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
              Seus dados fiscais
              <br />
              <span className="gradient-text">100% protegidos</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              Entendemos a importância dos dados fiscais da sua empresa. Por isso,
              implementamos múltiplas camadas de segurança para garantir que suas
              informações estejam sempre protegidas.
            </p>

            {/* Security badge */}
            <div className="mt-8 flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 w-fit">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="font-semibold">Comunicação Oficial SEFAZ</p>
                <p className="text-sm text-muted-foreground">
                  Integração via ACBr - Padrão do mercado brasileiro
                </p>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex flex-wrap gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 text-primary" />
                Backups diários
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                TLS 1.3
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4 text-primary" />
                99.9% uptime
              </div>
            </div>
          </motion.div>

          {/* Right content - Security cards */}
          <div className="grid sm:grid-cols-2 gap-4">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
