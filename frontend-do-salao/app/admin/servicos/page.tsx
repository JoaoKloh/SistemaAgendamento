import { backendFetchJson } from "@/lib/server-fetch"
import { ServicosManager, type ItemDTO } from "./servicos-manager"

export default async function AdminServicosPage() {
  // Busca inicial única no servidor: o HTML já chega com o catálogo
  // hidratado; a partir daí o ServicosManager assume as mutações no cliente.
  const [initialServicos, initialProdutos] = await Promise.all([
    backendFetchJson<ItemDTO[]>("/servicos", []),
    backendFetchJson<ItemDTO[]>("/servicos/produtos", []),
  ])

  return <ServicosManager initialServicos={initialServicos} initialProdutos={initialProdutos} />
}
