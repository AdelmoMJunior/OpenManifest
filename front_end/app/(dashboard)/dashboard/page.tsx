'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/types'
import type { NotasResponse } from '@/lib/types'
import {
  FileText,
  Download,
  Clock,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface DashboardStats {
  total: number
  pendentes: number
  completas: number
  valor_mes_atual: number
  valor_mes_passado: number
  diferenca_percentual: number
}

export default function DashboardPage() {
  const { user, config } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentNotes, setRecentNotes] = useState<NotasResponse['items']>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.tenant_cnpj || !config) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch recent notes
        const notasResponse = await api.getNotas(user.tenant_cnpj, {
          page: 1,
          limit: 5,
        })
        setRecentNotes(notasResponse.items)

        // Fetch real stats from backend
        const statsResponse = await api.getDashboardStats(user.tenant_cnpj)
        setStats(statsResponse)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user?.tenant_cnpj, config])

  // Onboarding state - no config
  if (!config) {
    return (
      <div className="py-8">
        <div className="text-center max-w-md mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Bem-vindo ao OpenManifest!</h1>
          <p className="text-muted-foreground mb-6">
            Para começar a receber suas notas fiscais, configure seu certificado digital.
          </p>
          <Link href="/dashboard/certificado">
            <Button className="glow">
              Configurar Certificado
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas notas fiscais
          </p>
        </div>
        <Link href="/dashboard/notas">
          <Button>
            Ver Todas as Notas
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Notas
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-warning">
                {stats?.pendentes || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completas
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold text-emerald-500">
                {stats?.completas || 0}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total (Mês)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="space-y-1">
                <p className="text-2xl font-bold">
                  {formatCurrency(stats?.valor_mes_atual || 0)}
                </p>
                <p className={`text-xs flex items-center gap-1 ${
                  (stats?.diferenca_percentual || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {stats?.diferenca_percentual && stats.diferenca_percentual !== 0 ? (
                    <>
                      <TrendingUp className={`h-3 w-3 ${stats.diferenca_percentual < 0 ? 'rotate-180' : ''}`} />
                      {stats.diferenca_percentual > 0 ? '+' : ''}{stats.diferenca_percentual}% 
                      <span className="text-muted-foreground ml-1">vs mês passado</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Sem dados comparativos</span>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Recentes</CardTitle>
          <CardDescription>
            Últimas notas fiscais recebidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma nota encontrada ainda.</p>
              <p className="text-sm">
                As notas serão sincronizadas automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((nota) => (
                <div
                  key={nota.chave_acesso}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        nota.manifestacao === 'sem_manifestacao'
                          ? 'bg-warning/20'
                          : 'bg-green-500/20'
                      }`}
                    >
                      {nota.manifestacao === 'sem_manifestacao' ? (
                        <AlertCircle className="h-5 w-5 text-warning" />
                      ) : (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {nota.emitente_razao_social}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        NF-e {nota.numero} • {formatDate(nota.data_emissao)}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold whitespace-nowrap ml-4">
                    {formatCurrency(nota.valor_total)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
