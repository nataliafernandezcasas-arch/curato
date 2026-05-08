import Link from "next/link";
import { isAdmin, getAdminPass } from "@/lib/admin/auth";
import AdminLoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = !!getAdminPass();
  const ok = await isAdmin();

  if (!configured) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-deep flex items-center justify-center px-5">
        <div className="max-w-[380px] text-center">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-copper mb-6">Error de configuración</p>
          <p className="font-serif text-[15px] font-light text-text-muted">
            Falta la variable <code className="text-champagne">ADMIN_PASS</code> en Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="min-h-[100dvh] bg-charcoal-deep flex items-center justify-center px-5">
        <div className="w-full max-w-[360px]">
          <div className="text-center mb-10">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto", display: "inline-block" }} />
            </Link>
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mt-6 mb-3">Acceso interno</p>
            <h1 className="font-serif text-2xl font-light tracking-[0.28em] uppercase text-text-primary">Admin</h1>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-charcoal-deep">
      <nav className="border-b border-white/10 px-5 h-14 flex items-center bg-black/40 backdrop-blur-sm">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-champagne/40">Admin</span>
            <div className="w-px h-3 bg-white/10" />
            <Link href="/admin" className="font-serif text-[12px] tracking-wider text-text-secondary hover:text-champagne transition-colors">
              Candidaturas
            </Link>
          </div>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="font-serif text-[12px] tracking-wider text-text-muted hover:text-text-secondary transition-colors">
              Salir
            </button>
          </form>
        </div>
      </nav>
      {children}
    </div>
  );
}
