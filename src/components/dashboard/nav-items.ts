import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BarChart3,
  CandlestickChart,
  History,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export const NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/dashboard/trade", label: "Trade", icon: CandlestickChart },
      { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
      { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
    ],
  },
  {
    label: "Funds",
    items: [
      { href: "/dashboard/deposit", label: "Deposit", icon: ArrowDownToLine },
      { href: "/dashboard/withdraw", label: "Withdraw", icon: ArrowUpFromLine },
      { href: "/dashboard/history", label: "History", icon: History },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/security", label: "Security", icon: ShieldCheck },
      { href: "/dashboard/support", label: "Support", icon: LifeBuoy },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

export const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/markets", label: "Markets", icon: BarChart3 },
  { href: "/dashboard/trade", label: "Trade", icon: CandlestickChart },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/history", label: "History", icon: History },
];
