import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  Disc3,
  ExternalLink,
  HandHeart,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Newspaper,
  Settings,
  Share2,
  Users,
  X,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { Logo } from "@/components/common/logo";
import { useLogout } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { AdminUser } from "@/stores/auth-store";

const NAV = [
  {
    group: "CRM",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { to: "/admin/leads", label: "Leads", icon: Users },
      { to: "/admin/calendar", label: "Calendar", icon: CalendarDays },
      {
        to: "/admin/kirtan-bookings",
        label: "Kirtan Bookings",
        icon: HandHeart,
      },
      { to: "/admin/queries", label: "Queries", icon: Inbox },
    ],
  },
  {
    group: "Engage",
    items: [
      { to: "/admin/releases", label: "Releases", icon: Disc3 },
      { to: "/admin/whatsapp", label: "WhatsApp", icon: FaWhatsapp },
      { to: "/admin/blog", label: "Blog", icon: Newspaper },
      { to: "/admin/social", label: "Social Feed", icon: Share2 },
    ],
  },
  {
    group: "Setup",
    items: [{ to: "/admin/settings", label: "Settings", icon: Settings }],
  },
] as const;

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const logout = useLogout();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col bg-navy text-cream">
      <div className="flex h-16 items-center justify-between px-5">
        <Link to="/admin">
          <Logo className="h-9" />
        </Link>
        <button
          type="button"
          className="lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {NAV.map((g) => (
          <div key={g.group}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-cream/40">
              {g.group}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active =
                  "exact" in item && item.exact
                    ? pathname === item.to || pathname === `${item.to}/`
                    : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                        active
                          ? "bg-gradient-to-r from-gold/25 to-transparent font-semibold text-gold-light"
                          : "text-cream/70 hover:bg-white/5 hover:text-cream",
                      )}
                    >
                      <Icon className="size-4" /> {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-cream/70 hover:bg-white/5"
        >
          <ExternalLink className="size-4" /> View website
        </a>
        <div className="mt-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
          <div className="grid size-8 place-items-center rounded-full bg-gold font-semibold text-navy">
            {user.name.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-cream/50">{user.email}</p>
          </div>
          <button
            type="button"
            title="Sign out"
            aria-label="Sign out"
            onClick={async () => {
              await logout();
              navigate({ to: "/admin-login" });
            }}
            className="rounded-md p-1.5 text-cream/60 hover:bg-white/10 hover:text-cream"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f4ee]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        {sidebar}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <Logo variant="dark" className="h-8" />
        </header>
        <main className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl text-navy sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
