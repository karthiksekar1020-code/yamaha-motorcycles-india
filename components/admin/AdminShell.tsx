"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bike, ClipboardList, ExternalLink, FileText, Images, LayoutDashboard, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { api } from "@/lib/admin/client";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/motorcycles", label: "Motorcycles", icon: Bike },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/content", label: "Page content", icon: FileText },
  { href: "/admin/audit", label: "Activity log", icon: ClipboardList },
  { href: "/admin/security", label: "Account security", icon: ShieldCheck },
] as const;

function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => { setBusy(true); await api("/api/admin/auth/logout", { method: "POST" }); router.replace("/admin/login"); router.refresh(); }}
      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-muted hover:bg-blue/10 hover:text-fg disabled:opacity-60"
    >
      <LogOut size={18} aria-hidden /> {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

function NavList({ email, onNavigate }: { email: string; onNavigate?: () => void }) {
  const path = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pb-6 pt-5">
        <p className="display text-2xl tracking-[.14em]">YAMAHA</p>
        <p className="micro mt-1">Owner console</p>
      </div>
      <nav aria-label="Admin" className="flex-1 space-y-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <Link key={href} href={href} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className="flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 text-sm text-muted hover:bg-blue/10 hover:text-fg aria-[current=page]:border-blue-bright aria-[current=page]:bg-blue/15 aria-[current=page]:text-fg">
              <Icon size={18} aria-hidden /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-2">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 text-sm text-muted hover:bg-blue/10 hover:text-fg"><ExternalLink size={18} aria-hidden /> View website</a>
        <SignOut />
        <p className="truncate px-4 pb-2 pt-1 text-xs text-muted" title={email}>{email}</p>
      </div>
    </div>
  );
}

export function AdminShell({ email, children }: { email: string; children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  return (
    <div className="min-h-[100svh] lg:grid lg:grid-cols-[260px_1fr]">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-black">Skip to content</a>

      <aside className="sticky top-0 hidden h-[100svh] border-r border-line bg-surface lg:block"><NavList email={email} /></aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden">
        <p className="display text-xl tracking-[.14em]">YAMAHA <span className="micro ml-1">Owner</span></p>
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" aria-haspopup="dialog" className="p-2"><Menu size={22} /></button>
      </header>
      <ModalDialog open={open} onClose={() => setOpen(false)} label="Admin menu" className="fixed inset-y-0 left-0 right-auto h-full w-[min(86vw,320px)]">
        <div className="relative h-full border-r border-line bg-surface">
          <button onClick={() => setOpen(false)} aria-label="Close admin menu" className="absolute right-2 top-3 p-2"><X size={22} /></button>
          <NavList email={email} onNavigate={() => setOpen(false)} />
        </div>
      </ModalDialog>

      <main id="admin-main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-10">{children}</main>
    </div>
  );
}
