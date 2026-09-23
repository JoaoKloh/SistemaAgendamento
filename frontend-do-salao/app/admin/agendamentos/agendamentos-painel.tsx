"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Plus,
  Scissors,
  Trash2,
  User,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface AgendamentoDetalhadoResponseDTO {
  agendamentoId: number
  clienteNome: string
  clienteEmail: string
  clienteTelefone: string
  dataAgendamento: string
  horaAgendamento: string
  statusAgendamento: boolean
  valorTotal: number
  itens: string[]
}

interface AgendamentosPainelProps {
  dataInicial: string
  agendamentosIniciais: AgendamentoDetalhadoResponseDTO[]
}

interface ItemSelecionavel {
  id: number
  nome: string
  tipo: "Serviço" | "Produto"
}

interface FormularioEdicao {
  data: string
  hora: string
  status: boolean
}

// --- Utilitários de data/hora (apenas apresentação, sem regra de negócio) ---

const DIAS_SEMANA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"]
const HORA_INICIO_GRADE = 7
const HORA_FIM_GRADE = 21
const PX_POR_MINUTO = 1.5

const PALETA_CORES = [
  { bg: "bg-orange-100 dark:bg-orange-500/15", borda: "border-orange-400 dark:border-orange-400/50", texto: "text-orange-900 dark:text-orange-200" },
  { bg: "bg-emerald-100 dark:bg-emerald-500/15", borda: "border-emerald-400 dark:border-emerald-400/50", texto: "text-emerald-900 dark:text-emerald-200" },
  { bg: "bg-violet-100 dark:bg-violet-500/15", borda: "border-violet-400 dark:border-violet-400/50", texto: "text-violet-900 dark:text-violet-200" },
  { bg: "bg-sky-100 dark:bg-sky-500/15", borda: "border-sky-400 dark:border-sky-400/50", texto: "text-sky-900 dark:text-sky-200" },
]

function parseDataISO(iso: string): Date {
  const [ano, mes, dia] = iso.split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function formatarDataISO(data: Date): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, "0")
  const dia = String(data.getDate()).padStart(2, "0")
  return `${ano}-${mes}-${dia}`
}

function adicionarDias(data: Date, dias: number): Date {
  const copia = new Date(data)
  copia.setDate(copia.getDate() + dias)
  return copia
}

function obterDiasDaSemana(iso: string): Date[] {
  const base = parseDataISO(iso)
  const inicioSemana = adicionarDias(base, -base.getDay())
  return Array.from({ length: 7 }, (_, i) => adicionarDias(inicioSemana, i))
}

function horaParaMinutos(hora: string): number {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

function formatarHoraCurta(minutosTotais: number): string {
  const h = Math.floor(minutosTotais / 60)
  const m = minutosTotais % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

// Monta o link do WhatsApp a partir do telefone cadastrado. Números
// brasileiros salvos sem DDI (10 ou 11 dígitos) recebem o prefixo 55.
function telefoneParaLinkWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "")
  const comDDI = digitos.length <= 11 ? `55${digitos}` : digitos
  return `https://wa.me/${comDDI}`
}

function normalizarNome(nome: string): string {
  return nome.trim().toLowerCase()
}

// Duração real não é retornada pela API — apenas a hora de início. Estimamos
// a altura do bloco pela quantidade de itens do agendamento, só para efeito
// visual da grade (não altera nenhum dado ou regra de negócio).
function estimarDuracaoMinutos(itens: string[]): number {
  return itens.length >= 3 ? 50 : 45
}

/**
 * Client Component: recebe a carga do dia atual já pronta via SSR. Trocar a
 * data dispara uma nova busca (o dado depende da escolha do usuário, então
 * não dá pra vir tudo no primeiro HTML), mas o stream SSE mescla eventos
 * novos direto no estado local (setAgendamentos), sem nunca recarregar a
 * página ou refazer a busca REST inteira.
 */
export function AgendamentosPainel({ dataInicial, agendamentosIniciais }: AgendamentosPainelProps) {
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhadoResponseDTO[]>(agendamentosIniciais)
  const [dataSelecionada, setDataSelecionada] = useState<string>(dataInicial)
  const [isConnected, setIsConnected] = useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoDetalhadoResponseDTO | null>(null)

  // Edição/exclusão do agendamento aberto no modal de detalhes
  const [modoEdicao, setModoEdicao] = useState(false)
  const [formEdicao, setFormEdicao] = useState<FormularioEdicao>({ data: "", hora: "", status: true })
  const [itensDisponiveis, setItensDisponiveis] = useState<ItemSelecionavel[]>([])
  const [itensSelecionadosIds, setItensSelecionadosIds] = useState<number[]>([])
  const [carregandoItens, setCarregandoItens] = useState(false)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  const dataInputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // O listener do SSE (efeito 2) é montado uma única vez, então ele fecha
  // sobre o valor de `dataSelecionada` do momento da montagem. Esse ref
  // mantém a data atual acessível dentro do listener sem precisar recriar a
  // conexão EventSource a cada troca de data.
  const dataSelecionadaRef = useRef(dataSelecionada)
  useEffect(() => {
    dataSelecionadaRef.current = dataSelecionada
  }, [dataSelecionada])

  // 1. Troca de data via REST API (proxy do BFF em /api, mesma origem).
  // Na primeira renderização, se a data ainda é a de hoje, os dados já vieram
  // prontos via SSR (agendamentosIniciais) — não faz sentido buscar de novo.
  // Mas essa dispensa vale só uma vez: se o usuário navegar para outra data e
  // voltar para hoje depois, "dataSelecionada === dataInicial" volta a ser
  // verdadeiro e o fetch PRECISA rodar, senão o painel fica preso mostrando
  // os agendamentos da última data visitada.
  const primeiraRenderizacaoRef = useRef(true)

  useEffect(() => {
    if (primeiraRenderizacaoRef.current) {
      primeiraRenderizacaoRef.current = false
      if (dataSelecionada === dataInicial) return
    }

    let cancelado = false

    const fetchAgendamentosDoDia = async () => {
      try {
        const res = await fetch(`/api/admin/agendamento/dia?data=${dataSelecionada}`, {
          credentials: "include",
        })
        if (res.ok && !cancelado) {
          const data = await res.json()
          setAgendamentos(data)
        }
      } catch (err) {
        console.error("Erro ao carregar agendamentos da data:", err)
      }
    }

    fetchAgendamentosDoDia()
    return () => {
      cancelado = true
    }
  }, [dataSelecionada, dataInicial])

  // 2. Conexão SSE: executa apenas uma vez na montagem do componente
  useEffect(() => {
    const eventSource = new EventSource(`/api/admin/stream`, {
      withCredentials: true,
    })

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.addEventListener("connect", () => {
      setIsConnected(true)
    })

    eventSource.addEventListener("agendamento-atualizado", (event) => {
      try {
        const novoAgendamento: AgendamentoDetalhadoResponseDTO = JSON.parse(event.data)

        // Só mescla no estado local se o agendamento pertence à data que
        // está sendo exibida agora — evita que um agendamento criado para
        // outro dia apareça na visualização atual.
        if (novoAgendamento.dataAgendamento !== dataSelecionadaRef.current) return

        setAgendamentos((prev) => {
          const jaExiste = prev.some((a) => a.agendamentoId === novoAgendamento.agendamentoId)
          if (jaExiste) return prev

          const atualizados = [novoAgendamento, ...prev]
          return atualizados.sort((a, b) => a.horaAgendamento.localeCompare(b.horaAgendamento))
        })
      } catch (err) {
        console.error("Erro ao processar evento SSE:", err)
      }
    })

    eventSource.onerror = () => {
      setIsConnected(false)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  // 3. Apenas apresentação: rola a grade até o primeiro agendamento do dia
  useEffect(() => {
    if (agendamentos.length === 0 || !scrollAreaRef.current) return
    const primeiraHora = Math.min(...agendamentos.map((a) => horaParaMinutos(a.horaAgendamento)))
    const topo = Math.max(0, (primeiraHora - HORA_INICIO_GRADE * 60) * PX_POR_MINUTO - 80)
    scrollAreaRef.current.scrollTo({ top: topo, behavior: "smooth" })
  }, [agendamentos, dataSelecionada])

  const diasDaSemana = useMemo(() => obterDiasDaSemana(dataSelecionada), [dataSelecionada])

  const rotuloCabecalho = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(
        parseDataISO(dataSelecionada)
      ),
    [dataSelecionada]
  )

  const horas = useMemo(
    () => Array.from({ length: HORA_FIM_GRADE - HORA_INICIO_GRADE + 1 }, (_, i) => HORA_INICIO_GRADE + i),
    []
  )

  const alturaTotalGrade = (HORA_FIM_GRADE - HORA_INICIO_GRADE) * 60 * PX_POR_MINUTO

  const abrirSeletorDeData = () => {
    const el = dataInputRef.current
    if (!el) return
    if (typeof el.showPicker === "function") {
      el.showPicker()
    } else {
      el.focus()
    }
  }

  const navegarSemana = (dias: number) => {
    setDataSelecionada(formatarDataISO(adicionarDias(parseDataISO(dataSelecionada), dias)))
  }

  const fecharDetalhe = () => {
    if (salvandoEdicao || excluindo) return
    setAgendamentoSelecionado(null)
    setModoEdicao(false)
  }

  // Recarrega a lista do dia visível após uma edição ou exclusão bem-sucedida
  // (a resposta do PUT/DELETE não traz os dados completos do agendamento).
  const recarregarAgendamentosDoDia = async () => {
    try {
      const res = await fetch(`/api/admin/agendamento/dia?data=${dataSelecionada}`, {
        credentials: "include",
      })
      if (res.ok) {
        setAgendamentos(await res.json())
      }
    } catch (err) {
      console.error("Erro ao recarregar agendamentos:", err)
    }
  }

  const ativarModoEdicao = async () => {
    if (!agendamentoSelecionado) return

    setFormEdicao({
      data: agendamentoSelecionado.dataAgendamento,
      hora: agendamentoSelecionado.horaAgendamento.substring(0, 5),
      status: agendamentoSelecionado.statusAgendamento,
    })

    let lista = itensDisponiveis
    if (lista.length === 0) {
      setCarregandoItens(true)
      try {
        const [resServicos, resProdutos] = await Promise.all([
          fetch("/api/servicos", { credentials: "include" }),
          fetch("/api/servicos/produtos", { credentials: "include" }),
        ])
        if (!resServicos.ok || !resProdutos.ok) {
          throw new Error("Não foi possível carregar a lista de serviços e produtos.")
        }
        const [servicos, produtos] = await Promise.all([resServicos.json(), resProdutos.json()])
        lista = [
          ...servicos.map((s: { id: number; nome: string }) => ({ id: s.id, nome: s.nome, tipo: "Serviço" as const })),
          ...produtos.map((p: { id: number; nome: string }) => ({ id: p.id, nome: p.nome, tipo: "Produto" as const })),
        ]
        setItensDisponiveis(lista)
      } catch (err) {
        console.error(err)
        toast.error("Não foi possível carregar a lista de serviços e produtos.")
        return
      } finally {
        setCarregandoItens(false)
      }
    }

    const nomesAtuais = agendamentoSelecionado.itens.map(normalizarNome)
    setItensSelecionadosIds(
      lista.filter((item) => nomesAtuais.includes(normalizarNome(item.nome))).map((item) => item.id)
    )
    setModoEdicao(true)
  }

  const alternarItemSelecionado = (id: number) => {
    setItensSelecionadosIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }

  const handleSalvarEdicao = async () => {
    if (!agendamentoSelecionado) return
    if (itensSelecionadosIds.length === 0) {
      toast.error("Selecione ao menos um serviço ou produto.")
      return
    }

    setSalvandoEdicao(true)
    try {
      const res = await fetch("/api/admin/atualizar", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idAgendamento: agendamentoSelecionado.agendamentoId,
          dataAgendamento: formEdicao.data,
          horaAgendamento: formEdicao.hora,
          statusAgendamento: formEdicao.status,
          itensIds: itensSelecionadosIds,
        }),
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}))
        throw new Error(erro.message || "Não foi possível atualizar o agendamento.")
      }

      toast.success("Agendamento atualizado com sucesso!")
      await recarregarAgendamentosDoDia()
      setAgendamentoSelecionado(null)
      setModoEdicao(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o servidor.")
    } finally {
      setSalvandoEdicao(false)
    }
  }

  const handleExcluir = async () => {
    if (!agendamentoSelecionado) return
    const confirmado = window.confirm(
      `Excluir o agendamento de ${agendamentoSelecionado.clienteNome}? Essa ação não pode ser desfeita.`
    )
    if (!confirmado) return

    setExcluindo(true)
    try {
      const res = await fetch(`/api/admin/apagar/${agendamentoSelecionado.agendamentoId}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}))
        throw new Error(erro.message || "Não foi possível excluir o agendamento.")
      }

      setAgendamentos((prev) => prev.filter((a) => a.agendamentoId !== agendamentoSelecionado.agendamentoId))
      toast.success("Agendamento excluído.")
      setAgendamentoSelecionado(null)
      setModoEdicao(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao conectar com o servidor.")
    } finally {
      setExcluindo(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {/* Cabeçalho: notificações + data selecionada */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          title={isConnected ? "Conectado ao vivo" : "Reconectando..."}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-foreground"
        >
          <Bell className="h-4 w-4" />
          <span
            className={cn(
              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
              isConnected ? "bg-emerald-500" : "bg-destructive"
            )}
          />
        </button>

        <div className="flex flex-col items-center">
          <input
            ref={dataInputRef}
            type="date"
            value={dataSelecionada}
            onChange={(e) => setDataSelecionada(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
          <button
            type="button"
            onClick={abrirSeletorDeData}
            className="flex items-center gap-1 text-sm font-semibold capitalize text-foreground"
          >
            {rotuloCabecalho}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground">
            {String(HORA_INICIO_GRADE).padStart(2, "0")}:00 - {String(HORA_FIM_GRADE).padStart(2, "0")}:00
          </span>
        </div>

        <div className="flex w-9 justify-end gap-1">
          <button
            type="button"
            onClick={() => navegarSemana(-7)}
            aria-label="Semana anterior"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tira de dias da semana */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-2 shadow-xs">
        {diasDaSemana.map((dia) => {
          const iso = formatarDataISO(dia)
          const selecionado = iso === dataSelecionada
          return (
            <button
              key={iso}
              type="button"
              onClick={() => setDataSelecionada(iso)}
              className="flex flex-1 flex-col items-center gap-1.5 py-1.5"
            >
              <span className="text-[10px] font-medium text-muted-foreground">{DIAS_SEMANA[dia.getDay()]}</span>
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  selecionado
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                )}
              >
                {dia.getDate()}
              </span>
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => navegarSemana(7)}
          aria-label="Próxima semana"
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Grade de horários do dia */}
      <div
        ref={scrollAreaRef}
        className="relative max-h-[65vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-xs"
      >
        <div className="relative" style={{ height: alturaTotalGrade }}>
          {horas.map((hora, index) => (
            <div
              key={hora}
              className="absolute left-0 right-0 border-t border-border/70"
              style={{ top: index * 60 * PX_POR_MINUTO }}
            >
              <span className="absolute -top-2.5 left-2 w-10 bg-card pr-1 text-[10px] font-medium text-muted-foreground">
                {String(hora).padStart(2, "0")}:00
              </span>
              {[15, 30, 45].map((minuto) => (
                <div
                  key={minuto}
                  className="absolute left-0 right-0 border-t border-dashed border-border/40"
                  style={{ top: minuto * PX_POR_MINUTO }}
                >
                  <span className="absolute -top-2 left-2 w-10 bg-card pr-1 text-[9px] text-muted-foreground/70">
                    {minuto}
                  </span>
                </div>
              ))}
            </div>
          ))}

          {agendamentos.map((item, index) => {
            const inicioMin = horaParaMinutos(item.horaAgendamento)
            const duracao = estimarDuracaoMinutos(item.itens)
            const top = (inicioMin - HORA_INICIO_GRADE * 60) * PX_POR_MINUTO
            const altura = Math.max(duracao * PX_POR_MINUTO, 38)
            const cor = PALETA_CORES[index % PALETA_CORES.length]
            const compacto = altura < 56

            if (inicioMin < HORA_INICIO_GRADE * 60 || inicioMin > HORA_FIM_GRADE * 60) return null

            return (
              <button
                key={item.agendamentoId}
                type="button"
                onClick={() => setAgendamentoSelecionado(item)}
                className={cn(
                  "absolute left-14 right-2 overflow-hidden rounded-lg border-l-4 px-2.5 py-1 text-left shadow-xs transition-transform hover:z-10 hover:scale-[1.01]",
                  cor.bg,
                  cor.borda
                )}
                style={{ top, height: altura }}
              >
                <p className={cn("text-[11px] font-semibold leading-tight", cor.texto)}>
                  {formatarHoraCurta(inicioMin)} - {formatarHoraCurta(inicioMin + duracao)}
                </p>
                <p className={cn("truncate text-xs font-bold leading-tight", cor.texto)}>{item.clienteNome}</p>
                {!compacto && (
                  <p className={cn("truncate text-[11px] leading-tight opacity-80", cor.texto)}>
                    {item.itens?.join(" + ") || "Serviço padrão"}
                  </p>
                )}
              </button>
            )
          })}

          {agendamentos.length === 0 && (
            <div className="absolute inset-x-0 top-10 text-center text-sm text-muted-foreground">
              Nenhum agendamento registrado para a data selecionada.
            </div>
          )}
        </div>
      </div>

      {/* Barra inferior: voltar para hoje + novo agendamento */}
      <div className="sticky bottom-4 z-10 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full border border-border bg-card px-2 py-2 shadow-md">
          <button
            type="button"
            onClick={() => setDataSelecionada(dataInicial)}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Hoje
          </button>
          <Link
            href="/agendamento"
            aria-label="Novo agendamento"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Detalhes do agendamento selecionado */}
      {agendamentoSelecionado && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={fecharDetalhe}
        >
          <div
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-lg sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="inline-flex items-center gap-1.5 text-lg font-bold text-primary">
                  <Clock className="h-4 w-4" />
                  {agendamentoSelecionado.horaAgendamento.substring(0, 5)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
                    parseDataISO(agendamentoSelecionado.dataAgendamento)
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={fecharDetalhe}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-accent"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!modoEdicao ? (
              <>
                <div className="mt-4 space-y-3 border-t border-border/60 pt-4 text-sm">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {agendamentoSelecionado.clienteNome}
                  </div>
                  {agendamentoSelecionado.clienteTelefone && (
                    <a
                      href={telefoneParaLinkWhatsApp(agendamentoSelecionado.clienteTelefone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-muted-foreground hover:text-emerald-600"
                    >
                      <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                      {agendamentoSelecionado.clienteTelefone}
                      <span className="text-xs font-medium text-emerald-600 underline underline-offset-2">
                        Abrir WhatsApp
                      </span>
                    </a>
                  )}
                  {agendamentoSelecionado.clienteEmail && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                      {agendamentoSelecionado.clienteEmail}
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Scissors className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{agendamentoSelecionado.itens?.join(", ") || "Serviço padrão"}</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-sm text-muted-foreground">Valor total</span>
                  <span className="text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      agendamentoSelecionado.valorTotal
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-border/60 pt-4">
                  <button
                    type="button"
                    onClick={ativarModoEdicao}
                    disabled={carregandoItens}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    {carregandoItens ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4" />}
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={handleExcluir}
                    disabled={excluindo}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    {excluindo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Excluir
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-4 space-y-4 border-t border-border/60 pt-4 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Data</span>
                    <input
                      type="date"
                      value={formEdicao.data}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, data: e.target.value }))}
                      className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Hora</span>
                    <input
                      type="time"
                      value={formEdicao.hora}
                      onChange={(e) => setFormEdicao((f) => ({ ...f, hora: e.target.value }))}
                      className="rounded-lg border border-border bg-transparent px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </label>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground">Status</span>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormEdicao((f) => ({ ...f, status: true }))}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                        formEdicao.status
                          ? "border-emerald-400 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      Confirmado
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormEdicao((f) => ({ ...f, status: false }))}
                      className={cn(
                        "flex-1 rounded-lg border py-1.5 text-sm font-semibold transition-colors",
                        !formEdicao.status
                          ? "border-orange-400 bg-orange-100 text-orange-900 dark:bg-orange-500/15 dark:text-orange-200"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      Pendente
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-medium text-muted-foreground">Serviços e produtos</span>
                  <div className="mt-1 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                    {itensDisponiveis.length === 0 && (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        Nenhum serviço ou produto ativo encontrado.
                      </p>
                    )}
                    {itensDisponiveis.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={itensSelecionadosIds.includes(item.id)}
                          onChange={() => alternarItemSelecionado(item.id)}
                          className="h-4 w-4 rounded border-border"
                        />
                        <span className="flex-1 text-foreground">{item.nome}</span>
                        <span className="text-xs text-muted-foreground">{item.tipo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setModoEdicao(false)}
                    disabled={salvandoEdicao}
                    className="flex-1 rounded-lg border border-border py-2 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSalvarEdicao}
                    disabled={salvandoEdicao}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                  >
                    {salvandoEdicao && <Loader2 className="h-4 w-4 animate-spin" />}
                    Salvar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
