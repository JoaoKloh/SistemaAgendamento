import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decodeJwt } from "jose"
import { put } from "@vercel/blob"

// Limite de corpo de requisição das Serverless Functions do Vercel no plano
// gratuito (Hobby): 4.5 MB. Barramos um pouco antes para devolver um erro
// legível em vez de deixar a plataforma cortar a requisição.
const TAMANHO_MAXIMO_BYTES = 4 * 1024 * 1024

// Pastas do Vercel Blob que essa rota tem permissão de gravar. Mantido como
// lista fechada para que o campo "pasta" enviado pelo cliente não vire um
// path arbitrário dentro do bucket.
const PASTAS_PERMITIDAS = ["portfolio", "produtos"] as const
type Pasta = (typeof PASTAS_PERMITIDAS)[number]

function ehPastaPermitida(valor: unknown): valor is Pasta {
  return typeof valor === "string" && (PASTAS_PERMITIDAS as readonly string[]).includes(valor)
}

/**
 * Essa rota não está sob o matcher do middleware (que só cobre /admin,
 * /dashboard e /auth), então a checagem de sessão de admin precisa ser feita
 * aqui — sem isso, qualquer visitante poderia consumir a cota gratuita do
 * Vercel Blob.
 */
async function usuarioEhAdmin(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value
  if (!token) return false

  try {
    const payload = decodeJwt(token)
    if (!payload.exp || Date.now() >= payload.exp * 1000) return false

    const roles = (payload.roles as string[]) || []
    return roles.includes("ROLE_ADMIN") || roles.includes("ADMIN")
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!(await usuarioEhAdmin())) {
    return NextResponse.json({ message: "Não autorizado." }, { status: 401 })
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { message: "Upload de fotos não configurado: falta a variável BLOB_READ_WRITE_TOKEN no servidor." },
      { status: 500 }
    )
  }

  const formData = await request.formData()
  const arquivo = formData.get("file")
  const pastaRecebida = formData.get("pasta")
  const pasta: Pasta = ehPastaPermitida(pastaRecebida) ? pastaRecebida : "portfolio"

  if (!(arquivo instanceof File)) {
    return NextResponse.json({ message: "Nenhum arquivo enviado." }, { status: 400 })
  }

  if (!arquivo.type.startsWith("image/")) {
    return NextResponse.json({ message: "Envie apenas arquivos de imagem." }, { status: 400 })
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return NextResponse.json({ message: "A imagem excede o limite de 4 MB." }, { status: 413 })
  }

  try {
    const blob = await put(`${pasta}/${Date.now()}-${arquivo.name}`, arquivo, {
      access: "public",
      addRandomSuffix: true,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err) {
    console.error("Erro ao enviar imagem para o Vercel Blob:", err)
    return NextResponse.json({ message: "Não foi possível enviar a imagem." }, { status: 502 })
  }
}
