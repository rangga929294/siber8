import {
  Banknote,
  Briefcase,
  Car,
  CircleDashed,
  CirclePlus,
  Clapperboard,
  Coins,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MoreHorizontal,
  PiggyBank,
  Receipt,
  ShoppingBag,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  banknote: Banknote,
  briefcase: Briefcase,
  "trending-up": TrendingUp,
  gift: Gift,
  "circle-plus": CirclePlus,
  utensils: UtensilsCrossed,
  car: Car,
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  clapperboard: Clapperboard,
  home: Home,
  landmark: Landmark,
  "more-horizontal": MoreHorizontal,
  wallet: Wallet,
  "piggy-bank": PiggyBank,
  gem: Gem,
  coins: Coins,
};

export function iconFor(name?: string | null): LucideIcon {
  return (name && ICONS[name]) || CircleDashed;
}

export interface AssetTypeMeta {
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export const ASSET_TYPES: Record<string, AssetTypeMeta> = {
  tunai: { label: "Tunai", icon: Wallet, color: "#7C6A3F", bg: "#F4EEDC" },
  bank: { label: "Bank & Deposito", icon: Landmark, color: "#2B6CB0", bg: "#E3EEF9" },
  investasi: { label: "Investasi", icon: TrendingUp, color: "#127A5B", bg: "#DFF0E8" },
  properti: { label: "Properti", icon: Home, color: "#B08968", bg: "#F2E8DF" },
  kendaraan: { label: "Kendaraan", icon: Car, color: "#7C6FD0", bg: "#E9E6F8" },
  lainnya: { label: "Lainnya", icon: Gem, color: "#64748B", bg: "#E8ECF1" },
};

export function assetMeta(type: string): AssetTypeMeta {
  return ASSET_TYPES[type] ?? ASSET_TYPES.lainnya;
}

export const ASSET_TYPE_KEYS = ["tunai", "bank", "investasi", "properti", "kendaraan", "lainnya"] as const;
