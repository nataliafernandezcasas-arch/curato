import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { isAdmin, getAdminPass } from "@/lib/admin/auth";
import AdminLoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = !!getAdminPass();
  const ok = await isAdmin();

  if (!configured) {
    return (
      <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-5">
        <div className="max-w-[380px] text-center">
          <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-3">Admin no configurado</h1>
          <p className="text-sm text-text-muted">Falta setear <code>ADMIN_PASS</code> en las env vars de Vercel.</p>
        </div>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-5">
        <div className="w-full max-w-[380px]">
          <Link href="/" aria-label="Midi Pass" className="inline-flex items-center gap-2 text-text-primary mb-10">
            <MidiLogo className="h-5 w-auto" />
            <span className="text-base font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <p className="text-[11px] font-semibold tracking-[0.22em] uppercase text-accent mb-3">Acceso interno</p>
          <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-8">Ingresá la clave</h1>
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
            <span className="ml-3 text-[10px] font-semibold tracking-[0.18em] uppercase text-accent">Admin</span>
          </Link>
          <div className="flex items-center gap-5 text-[13px] font-medium">
            <Link href="/admin/lanzamiento" className="text-text-primary">Lanzamiento</Link>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="text-text-muted hover:text-text-primary transition-colors">Salir</button>
            </form>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
