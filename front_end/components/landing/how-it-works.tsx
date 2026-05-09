'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { UserPlus, Upload, FileCheck, Zap } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Crie sua conta',
    description:
      'Cadastre-se gratuitamente com seu e-mail e CNPJ da empresa. Confirme seu e-mail para ativar a conta.',
  },
  {
    number: '02',
    icon: Upload,
    title: 'Envie seu certificado',
    description:
      'Faça upload do certificado digital A1 (.pfx) da sua empresa. Ele é necessário para comunicação segura com a SEFAZ.',
  },
  {
    number: '03',
    icon: Zap,
    title: 'Sincronização automática',
    description:
      'O sistema começa a buscar suas notas automaticamente. A cada 10 minutos, novas NF-e são importadas.',
  },
  {
    number: '04',
    icon: FileCheck,
    title: 'Gerencie suas notas',
    description:
      'Visualize, baixe XML, manifeste e organize suas notas fiscais. Tudo em uma interface simples e intuitiva.',
  },
]

export function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="como-funciona" className="py-24 md:py-32 bg-secondary/20 relative">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, var(--foreground) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">
            Como Funciona
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Comece a usar em
            <span className="gradient-text"> minutos</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Configuração simples e rápida. Em poucos passos você terá acesso completo
            às notas fiscais da sua empresa.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-primary/50 to-border" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Icon with Number badge */}
                <div className="relative mb-6">
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-card border border-border/50 relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <step.icon className="h-10 w-10 text-primary relative z-10" />
                  </div>
                  {/* Number badge */}
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg z-20">
                    <span className="text-xs font-bold">{step.number}</span>
                  </div>
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 border border-primary/20">
            <Zap className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              Tempo médio de configuração:{' '}
              <span className="text-primary">menos de 5 minutos</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
