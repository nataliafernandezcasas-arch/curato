import Link from "next/link";
import { isAdmin, getAdminPass } from "@/lib/admin/auth";
import AdminLoginForm from "./login-form";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const configured = !!getAdminPass();
  const ok = await isAdmin();

  if (!configured) {
    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
        <div className="absolute inset-0">
          <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 max-w-[380px] text-center">
          <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-copper mb-6">Error de configuración</p>
          <p className="font-serif text-[15px] font-light text-charcoal-deep">
            Falta la variable <code className="text-copper">ADMIN_PASS</code> en Vercel.
          </p>
        </div>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="min-h-[100dvh] relative flex items-center justify-center px-5">
        <div className="absolute inset-0">
          <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 w-full max-w-[360px]">
          <div className="text-center mb-10">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "14px", width: "auto", display: "inline-block", filter: "invert(1)" }} />
            </Link>
            <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-charcoal-deep/50 mt-6 mb-3">Acceso interno</p>
            <h1 className="font-serif text-2xl font-light tracking-[0.28em] uppercase text-charcoal-deep">Admin</h1>
          </div>
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src="/hero-floral.jpeg" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/10 px-5 h-14 flex items-center">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/">
              <img src="/logo-curato-simple.png" alt="curato" style={{ height: "12px", width: "auto", display: "block" }} />
            </Link>
            <span className="font-serif text-[10px] tracking-[0.3em] uppercase text-white/30">Admin</span>
            <div className="w-px h-3 bg-white/15" />
            <Link href="/admin" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
              Candidaturas
            </Link>
            <Link href="/admin/qr" className="font-serif text-[12px] tracking-wider text-white/60 hover:text-white transition-colors">
              QR Invitación
            </Link>
          </div>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="font-serif text-[12px] tracking-wider text-white/30 hover:text-white transition-colors">
              Salir
            </button>
          </form>
        </div>
      </nav>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
