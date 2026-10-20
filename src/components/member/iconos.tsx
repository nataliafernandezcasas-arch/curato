"use client";

import type { ComponentType, SVGProps } from "react";
import { Calendar, CreditCard, Home, MailIn, Shop, StatsUpSquare, User, Group, Book } from "iconoir-react";
import {
  ArrowLeft as IArrowLeft,
  ArrowRight as IArrowRight,
  CalendarCheck as ICalendarCheck,
  Camera as ICamera,
  Check as ICheck,
  CheckCircle as ICheckCircle,
  CheckCircleSolid as ICheckCircleSolid,
  Clock as IClock,
  Download as IDownload,
  Drag as IDrag,
  EditPencil as IEditPencil,
  Eye as IEye,
  Gift as IGift,
  InfoCircle as IInfoCircle,
  Page as IPage,
  EyeClosed as IEyeClosed,
  FilterList as IFilterList,
  Globe as IGlobe,
  HelpCircle as IHelpCircle,
  Instagram as IInstagram,
  LogOut as ILogOut,
  Mail as IMail,
  MapPin as IMapPin,
  Menu as IMenu,
  NavArrowDown as INavArrowDown,
  NavArrowLeft as INavArrowLeft,
  NavArrowRight as INavArrowRight,
  Plus as IPlus,
  QrCode as IQrCode,
  Search as ISearch,
  Sparks as ISparks,
  Star as IStar,
  StarSolid as IStarSolid,
  Trash as ITrash,
  WarningCircle as IWarningCircle,
  Xmark as IXmark,
  XmarkCircle as IXmarkCircle,
  ZoomIn as IZoomIn,
} from "iconoir-react";

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

/**
 * Toda la app con Iconoir (Natalia, 2026-10-20). Las pantallas escribían los
 * nombres y las props de Phosphor (size, weight); aquí cada nombre lleva a su
 * icono de Iconoir con el trazo de Curato, y «fill» al relleno cuando lo hay.
 */
export type IconProps = Omit<SVGProps<SVGSVGElement>, "ref"> & {
  size?: number | string;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
};
export type Icon = ComponentType<IconProps>;

type Base = ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number | string }>;

function icono(base: Base, relleno?: Base): Icon {
  function Icono({ size = 20, weight, ...rest }: IconProps) {
    const Svg = weight === "fill" && relleno ? relleno : base;
    return <Svg width={size} height={size} strokeWidth={weight === "bold" ? 2 : TRAZO} {...rest} />;
  }
  return Icono;
}

export const ArrowLeft = icono(IArrowLeft);
export const ArrowRight = icono(IArrowRight);
export const CalendarCheck = icono(ICalendarCheck);
export const Camera = icono(ICamera);
export const CaretDown = icono(INavArrowDown);
export const CaretLeft = icono(INavArrowLeft);
export const CaretRight = icono(INavArrowRight);
export const Check = icono(ICheck);
export const CheckCircle = icono(ICheckCircle, ICheckCircleSolid);
export const Clock = icono(IClock);
export const DotsSixVertical = icono(IDrag);
export const DownloadSimple = icono(IDownload);
export const EnvelopeSimple = icono(IMail);
export const Eye = icono(IEye);
export const EyeSlash = icono(IEyeClosed);
export const GlobeSimple = icono(IGlobe);
export const Gift = icono(IGift);
export const FileText = icono(IPage);
export const Info = icono(IInfoCircle);
export const InstagramLogo = icono(IInstagram);
export const List = icono(IMenu);
export const MagnifyingGlass = icono(ISearch);
export const MagnifyingGlassPlus = icono(IZoomIn);
export const MapPin = icono(IMapPin);
export const PencilSimple = icono(IEditPencil);
export const Plus = icono(IPlus);
export const QrCode = icono(IQrCode);
export const Question = icono(IHelpCircle);
export const SignOut = icono(ILogOut);
export const SlidersHorizontal = icono(IFilterList);
export const Sparkle = icono(ISparks);
export const Star = icono(IStar, IStarSolid);
export const Trash = icono(ITrash);
export const WarningCircle = icono(IWarningCircle);
export const X = icono(IXmark);
export const XCircle = icono(IXmarkCircle);
