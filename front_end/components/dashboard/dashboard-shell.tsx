'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardHeader } from './dashboard-header'
import { DashboardSidebar } from './dashboard-sidebar'
import { CertificateAlert } from './certificate-alert'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/lib/store'
import { api, getAccessToken } from '@/lib/api'

interface DashboardShellProps {
  children: React.ReactNode
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter()
  const { user, config, isLoading, setUser, setConfig, setLoading, isAuthenticated } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken()
      
      if (!token) {
        router.push('/login')
        return
      }

      try {
        // Get user data
        const userData = await api.getMe()
        setUser(userData)

        // Get config data
        try {
          const configData = await api.getConfig(userData.tenant_cnpj)
          setConfig(configData)
        } catch {
          // Config not found is ok - user needs to complete onboarding
          setConfig(null)
        }
      } catch (error) {
        // Auth failed, redirect to login
        router.push('/login')
        return
      } finally {
        setLoading(false)
        setHasCheckedAuth(true)
      }
    }

    if (!hasCheckedAuth) {
      checkAuth()
    }
  }, [hasCheckedAuth, router, setConfig, setLoading, setUser])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileMenuOpen])

  if (isLoading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <DashboardSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="md:pl-64 pt-4 pb-8">
        <div className="px-4 md:px-6 w-full">
          <CertificateAlert />
          {children}
        </div>
      </main>
    </div>
  )
}
