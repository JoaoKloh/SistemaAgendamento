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
