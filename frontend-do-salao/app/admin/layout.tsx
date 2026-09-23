"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Images,
  LogOut,
  Menu,
  X,
} from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Serviços & Produtos", href: "/admin/servicos", icon: Scissors },
    { name: "Agendamentos", href: "/admin/agendamentos", icon: Calendar },
    { name: "Portfólio", href: "/admin/portfolio", icon: Images },
  ]

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* HEADER ÚNICO E EXCLUSIVO PARA MOBILE */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <span className="font-title text-lg font-semibold tracking-tight text-foreground">Painel DVD</span>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
          className="rounded-lg border border-border p-2 text-foreground active:bg-accent"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      <div className="flex w-full min-w-0">
        {/* SIDEBAR DESKTOP */}
        <aside className="hidden h-screen w-64 shrink-0 flex-col justify-between border-r border-border bg-card p-6 md:sticky md:top-0 md:flex">
          <div className="w-full">
            <div className="mb-8 font-title text-xl font-semibold tracking-tight text-foreground">
              Painel DVD
            </div>
            <nav className="w-full space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          <button className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </aside>

        {/* DRAWER MENU MOBILE */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-card p-6 md:hidden">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <span className="font-title text-xl font-semibold tracking-tight text-foreground">Painel DVD</span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-2 text-foreground"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="mt-6 flex-1 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-base font-medium ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <button className="mt-auto flex w-full items-center justify-center gap-3 rounded-xl bg-destructive/10 py-3.5 text-base font-medium text-destructive">
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        )}

        {/* ÁREA DE CONTEÚDO */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}