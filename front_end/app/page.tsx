import { LandingHeader } from '@/components/landing/header'
import { HeroSection } from '@/components/landing/hero'
import { FeaturesSection } from '@/components/landing/features'
import { HowItWorksSection } from '@/components/landing/how-it-works'
import { SecuritySection } from '@/components/landing/security'
import { OpenSourceSection } from '@/components/landing/opensource'
import { CTASection } from '@/components/landing/cta'
import { Footer } from '@/components/landing/footer'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SecuritySection />
      <OpenSourceSection />
      <CTASection />
      <Footer />
    </main>
  )
}
