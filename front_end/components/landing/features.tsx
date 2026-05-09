'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle,
  Search,
  Clock,
  Bell,
  Tags,
} from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: 'Visualização Completa',
    description:
      'Acesse todas as NF-e emitidas contra seu CNPJ em um único lugar. Interface limpa e organizada para facilitar a gestão.',
  },
  {
    icon: Download,
    title: 'Download de XML',
    description:
      'Baixe os arquivos XML completos das suas notas fiscais. Integração automática para obter documentos ainda não disponíveis.',
  },
  {
    icon: RefreshCw,
    title: 'Sincronização Automática',
    description:
      'Robô em segundo plano verifica novas notas a cada 10 minutos. Você também pode sincronizar manualmente quando precisar.',
  },
  {
    icon: CheckCircle,
    title: 'Manifestação Simplificada',
    description:
      'Manifeste suas notas com um clique. Suporte a Ciência, Confirmação, Desconhecimento e Operação Não Realizada.',
  },
  {
    icon: Search,
    title: 'Filtros Avançados',
    description:
      'Pesquise por data, emitente, status de manifestação, valor e muito mais. Encontre qualquer nota em segundos.',
  },
  {
    icon: Clock,
    title: 'Histórico Completo',
    description:
      'Mantenha o registro de todas as operações realizadas. Acompanhe quando cada nota foi recebida e manifestada.',
  },
  {
    icon: Bell,
    title: 'Alertas de Certificado',
    description:
      'Receba avisos quando seu certificado digital estiver próximo do vencimento. Nunca fique sem acesso à SEFAZ.',
  },
  {
    icon: Tags,
    title: 'Selos e Workflow',
    description:
      'Organize suas notas com selos coloridos personalizados. Crie seu próprio fluxo de trabalho para gestão eficiente.',
  },
]

export function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="recursos" className="py-24 md:py-32 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]" />
      </div>

      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold tracking-wider uppercase">
            Recursos
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Tudo que você precisa para
            <br />
            <span className="gradient-text">gerenciar suas NF-e</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para simplificar a gestão fiscal da sua empresa.
            Integração direta com a SEFAZ e sincronização automática.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-card/80 transition-all duration-300"
            >
              {/* Glow on hover */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
