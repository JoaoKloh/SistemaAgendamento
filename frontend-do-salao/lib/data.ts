import { Scissors, Sparkles, Waves, Zap } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type Service = {
  id: string
  name: string
  description: string
  duration: string
  price: string
  icon: LucideIcon
}

export const services: Service[] = [
  {
    id: "corte",
    name: "Corte Masculino",
    description: "Cortes autorais como taper fade e freestyle, adaptados ao seu estilo.",
    duration: "45 min",
    price: "R$ 70",
    icon: Scissors,
  },
  {
    id: "barboterapia",
    name: "Barboterapia",
    description: "Toalha quente, óleos essenciais e navalha para uma barba impecável.",
    duration: "40 min",
    price: "R$ 55",
    icon: Sparkles,
  },
  {
    id: "vibroterapia",
    name: "Vibroterapia",
    description: "Massagem capilar e facial com vibração para relaxamento profundo.",
    duration: "20 min",
    price: "R$ 40",
    icon: Waves,
  },
  {
    id: "alinhamento",
    name: "Alinhamento",
    description: "Acabamento preciso e desenho de contornos para um visual refinado.",
    duration: "25 min",
    price: "R$ 45",
    icon: Zap,
  },
]

export const timeSlots = [
  "08:30",
  "09:15",
  "10:00",
  "10:45",
  "11:30",
  "13:00",
  "13:45",
  "14:30",
  "15:15",
  "16:00",
  "16:45",
  "17:30",
  "18:15",
]

export const salon = {
  name: "Salão Ideal",
  since: "1980",
  rating: "4.8",
  reviews: "120+",
  address: "Shopping Center Dom Pedro II — Rua do Imperador, 288, Loja 14, Centro, Petrópolis - RJ",
  phone: "+55 (24) 2246-6010",
  whatsapp: "(24) 98842-3784",
  hours: [
    { day: "Segunda-feira", time: "09:30 às 19:00" },
    { day: "Terça a Sábado", time: "08:30 às 19:00" },
    { day: "Domingo", time: "Fechado" },
  ],
}
