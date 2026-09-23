import { Suspense } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ConfirmationCard } from "@/components/booking/confirmation-card"

export default function ConcluidoPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-16">
        <Suspense fallback={null}>
          <ConfirmationCard />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
