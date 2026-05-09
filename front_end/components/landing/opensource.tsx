'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Github, Star, GitFork, Code2, Heart, Users } from 'lucide-react'

const benefits = [
  {
    icon: Code2,
    title: 'Código Transparente',
    description: 'Examine cada linha de código. Sem caixas pretas ou funcionalidades ocultas.',
  },
  {
    icon: Users,
    title: 'Comunidade Ativa',
    description: 'Contribua com melhorias, reporte bugs e ajude a construir a ferramenta.',
  },
  {
    icon: Heart,
    title: '100% Gratuito',
    description: 'Sem taxas escondidas, sem planos pagos. Gratuito para sempre.',
  },
]

export function OpenSourceSection() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="opensource" className="py-24 md:py-32 bg-secondary/20 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[120px]" />
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
            Open Source
          </span>
          <h2 className="mt-3 text-3xl md:text-4xl lg:text-5xl font-bold text-balance">
            Construído pela comunidade,
            <br />
            <span className="gradient-text">para a comunidade</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Acreditamos que ferramentas fiscais devem ser acessíveis a todos.
            Por isso, o OpenManifest é completamente open source e gratuito.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center p-8 rounded-2xl bg-card/50 border border-border/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                <benefit.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* GitHub CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur-2xl opacity-50" />
          <div className="relative p-8 md:p-12 rounded-2xl bg-card border border-border/50 text-center">
            <div className="flex justify-center mb-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-foreground/10">
                <Github className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Contribua no GitHub
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              O código está disponível para todos. Faça um fork, contribua com melhorias
              ou simplesmente dê uma estrela para apoiar o projeto.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="https://github.com/openmanifest"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" className="glow w-full sm:w-auto">
                  <Github className="mr-2 h-5 w-5" />
                  Ver Repositório
                </Button>
              </Link>
              <Link
                href="https://github.com/openmanifest/openmanifest/stargazers"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  <Star className="mr-2 h-5 w-5" />
                  Dar uma Estrela
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-primary" />
                <span>Fork e contribua</span>
              </div>
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-green-500" />
                <span>TypeScript + Next.js</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
