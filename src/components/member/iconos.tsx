import { Calendar, CreditCard, Home, MailIn, Shop, StatsUpSquare, User, Group, Book } from "iconoir-react";

/**
 * Los iconos de la barra de abajo. Curato usa Iconoir, de trazo 1,5 px
 * (Natalia, 2026-10-20, tras comparar Phosphor, Lucide, Tabler e Iconoir):
 * cada destino lleva su icono encima de la palabra, como en cualquier app.
 */
export const ICONOS_NAV = {
  adresses: Home,
  visites: Calendar,
  profil: User,
  demandes: MailIn,
  visiteurs: StatsUpSquare,
  maison: Shop,
  calendrier: Calendar,
  storytellers: Group,
  carnet: Book,
  factures: CreditCard,
} as const;

export type IconoNav = keyof typeof ICONOS_NAV;

/** El trazo de Curato, el mismo en todas partes. */
export const TRAZO = 1.5;
