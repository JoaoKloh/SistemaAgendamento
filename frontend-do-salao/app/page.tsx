import { Suspense } from "react"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/home/hero"
import { ServicesSection, ServicesSectionSkeleton, type ServiceDTO } from "@/components/home/services-section"
import { AboutSection } from "@/components/home/about-section"
import { PortfolioSection, PortfolioSectionSkeleton } from "@/components/home/portfolio-section"
import { backendFetchJson } from "@/lib/server-fetch"
import type { PortfolioFotoDTO } from "@/lib/types/portfolio"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

// Cada seção busca seus próprios dados e fica isolada em um Suspense: o
// shell da home (Hero, header, footer) renderiza de imediato via streaming
// SSR, sem esperar /servicos e /portfolio responderem, e cada seção exibe
// seu próprio skeleton enquanto a busca não termina.

async function ServicesSectionData() {
  const services = await backendFetchJson<ServiceDTO[]>("/servicos", [])
  return <ServicesSection services={services} />
}

async function PortfolioSectionData() {
  const fotosPortfolio = await backendFetchJson<PortfolioFotoDTO[]>("/portfolio", [])
  return <PortfolioSection fotos={fotosPortfolio} />
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Suspense fallback={<ServicesSectionSkeleton />}>
          <ServicesSectionData />
        </Suspense>
        <AboutSection />
        <Suspense fallback={<PortfolioSectionSkeleton />}>
          <PortfolioSectionData />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
