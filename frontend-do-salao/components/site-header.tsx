"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarCheck, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#sobre", label: "Sobre" },
  { href: "/#barbearia", label: "A Barbearia" },
  { href: "/#contato", label: "Contato" },
  { href: "/auth/login", label: "Login" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // "mounted" evita renderizar o menu filtrado por autenticação no servidor
  // (onde não há cookies), prevenindo divergência de hidratação.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true)

    const checkAuth = () => {
      if (typeof document === "undefined") return false

      // Parser robusto para cookies Same-Origin
      const match = document.cookie.match(/(?:^|;\s*)is-authenticated=([^;]*)/)
      if (match) {
        const val = decodeURIComponent(match[1]).replace(/^"|"$/g, "").trim()
        return val === "true"
      }
      return false
    }

    setIsAuthenticated(checkAuth())
  }, [pathname])

  // Filtra apenas a rota de login se estiver autenticado
  const visibleNavLinks = navLinks.filter((link) => {
    if (link.href === "/auth/login" && isAuthenticated) {
      return false
    }
    return true
  })

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex flex-col leading-none" onClick={() => setIsOpen(false)}>
          <span className="font-serif text-lg font-semibold tracking-tight text-foreground">
            David Rabello
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Salão Ideal
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {(isMounted ? visibleNavLinks : navLinks).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            href="/agendamento"
            className={cn(
              "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:px-5 sm:py-2.5 sm:text-sm",
              pathname === "/agendamento" && "opacity-90"
            )}
            onClick={() => setIsOpen(false)}
          >
            <CalendarCheck className="h-4 w-4" />
            <span>Agendar</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-secondary md:hidden"
            aria-label="Abrir menu de navegação"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="border-t border-border/70 bg-background/95 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex flex-col gap-1">
            {(isMounted ? visibleNavLinks : navLinks).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}