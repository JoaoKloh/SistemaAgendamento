import type { Metadata } from "next"
import { backendFetchJson } from "@/lib/server-fetch"
import type { PortfolioFotoDTO } from "@/lib/types/portfolio"
import { PortfolioManager } from "./portfolio-manager"

export const metadata: Metadata = {
  title: "Portfólio",
  robots: { index: false, follow: false },
}

export default async function AdminPortfolioPage() {
  // Busca inicial única no servidor: a galeria já chega pronta no HTML;
  // a partir daí o PortfolioManager assume upload/exclusão no cliente.
  const fotosIniciais = await backendFetchJson<PortfolioFotoDTO[]>("/portfolio", [])

  return <PortfolioManager fotosIniciais={fotosIniciais} />
}
