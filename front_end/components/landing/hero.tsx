'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowRight, Github, FileCheck, Download, Shield } from 'lucide-react'

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 200])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      style={{ position: 'relative' }}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-32"
      >
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            100% Gratuito e Open Source
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance"
          >
            Gestão de{' '}
            <span className="gradient-text">Notas Fiscais</span>
            <br />
            <span className="text-muted-foreground">simplificada</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty"
          >
            Visualize, baixe e manifeste todas as NF-e emitidas contra o CNPJ da sua empresa.
            Integração direta com a SEFAZ, sincronização automática e total controle das suas notas.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <Button size="lg" className="glow text-base px-8 h-12 w-full sm:w-auto">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link
              href="https://github.com/openmanifest"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="text-base px-8 h-12 w-full sm:w-auto">
                <Github className="mr-2 h-5 w-5" />
                Ver no GitHub
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto"
          >
            {[
              { icon: FileCheck, value: 'NF-e', label: 'Manifestação automática' },
              { icon: Download, value: 'XML', label: 'Download completo' },
              { icon: Shield, value: 'SEFAZ', label: 'Integração oficial' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-card/50 border border-border/50"
              >
                <stat.icon className="h-8 w-8 text-primary" />
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-20 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-2xl opacity-50" />
          <div className="relative rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-2xl">
            {/* Mock Browser Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-secondary/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                  app.openmanifest.com.br/dashboard
                </div>
              </div>
            </div>
            
            {/* Mock Dashboard Content */}
            <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: 'Notas Recebidas', value: '127', change: '+12 hoje' },
                  { label: 'Pendentes de Manifestação', value: '8', change: 'Ação necessária' },
                  { label: 'Valor Total (Mês)', value: 'R$ 847.291,00', change: '+23% vs anterior' },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="p-4 rounded-lg bg-secondary/50 border border-border/30"
                  >
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                    <p className="text-xs text-primary mt-1">{card.change}</p>
                  </div>
                ))}
              </div>
              
              {/* Mock Table */}
              <div className="rounded-lg border border-border/30 overflow-hidden">
                <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-secondary/30 text-sm font-medium text-muted-foreground">
                  <span>NF-e</span>
                  <span>Emitente</span>
                  <span>Valor</span>
                  <span>Data</span>
                  <span>Status</span>
                </div>
                {[
                  { nf: '000.127.891', emitente: 'Fornecedor ABC', valor: 'R$ 12.450,00', data: '08/05/2026', status: 'Confirmada' },
                  { nf: '000.127.890', emitente: 'Distribuidora XYZ', valor: 'R$ 8.920,00', data: '08/05/2026', status: 'Pendente' },
                  { nf: '000.127.889', emitente: 'Indústria 123', valor: 'R$ 45.100,00', data: '07/05/2026', status: 'Ciência' },
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-5 gap-4 px-4 py-3 text-sm border-t border-border/20"
                  >
                    <span className="font-mono">{row.nf}</span>
                    <span className="truncate">{row.emitente}</span>
                    <span>{row.valor}</span>
                    <span>{row.data}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium w-fit ${
                      row.status === 'Confirmada' ? 'bg-green-500/20 text-green-400' :
                      row.status === 'Pendente' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
