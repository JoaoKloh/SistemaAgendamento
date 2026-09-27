export interface ServicoDTO {
  id: number
  nome: string
  detalhes?: string
  duracao: string
  preco: number
}

export interface ProdutoDTO {
  id: number
  nome: string
  especificacoes?: string
  preco: number
  urlImagem?: string | null
}

// Resposta de GET /usuario/agendamentos (AgendamentoResponseUsuarioDTO.java).
// Serviços e produtos vêm na mesma lista, pois são a mesma entidade no backend.
export interface AgendamentoUsuarioDTO {
  idAgendamento: number
  dataAgendamento: string
  horaAgendamento: string
  valorTotal: number
  servicosProdutos: ServicoDTO[]
  statusAgendamento: boolean
}
