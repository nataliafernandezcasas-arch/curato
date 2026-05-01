"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { QrCode, Copy, CheckCircle } from "@phosphor-icons/react";

export default function BusinessQRPage() {
  const [qrCode, setQrCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("comercios").select("qr_code").eq("owner_id", user.id).maybeSingle();
      if (data?.qr_code) setQrCode(data.qr_code);
      setLoading(false);
    }
    load();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <div className="flex gap-5 text-[13px] font-medium">
            <Link href="/dashboard/business" className="text-text-muted hover:text-text-primary transition-colors">Mi Oferta</Link>
            <Link href="/dashboard/business/visits" className="text-text-muted hover:text-text-primary transition-colors">Visitas</Link>
            <Link href="/dashboard/business/qr" className="text-text-primary">QR Code</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[500px] mx-auto px-5 py-10">
        <h1 className="text-2xl font-extralight tracking-tighter text-text-primary mb-2">Tu QR Code</h1>
        <p className="text-sm text-text-muted mb-10">Los influencers escanean este código cuando llegan a tu negocio.</p>

        {loading ? (
          <p className="text-sm text-text-muted text-center py-12">Cargando...</p>
        ) : qrCode ? (
          <div className="border border-border rounded-xl p-8 text-center">
            <div className="w-48 h-48 mx-auto bg-surface-hover rounded-xl flex items-center justify-center mb-6">
              <QrCode size={120} weight="duotone" className="text-text-primary" />
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              <code className="text-lg font-bold text-text-primary tracking-widest">{qrCode}</code>
              <button onClick={handleCopy} className="text-text-muted hover:text-accent transition-colors active:scale-[0.95]">
                {copied ? <CheckCircle size={18} weight="fill" className="text-green-600" /> : <Copy size={18} />}
              </button>
            </div>

            <p className="text-xs text-text-muted mb-6">
              Imprime este código y ponlo visible en tu negocio. Los influencers lo escanean con la app de Midi Pass para hacer check-in.
            </p>

            <div className="border-t border-border pt-6">
              <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Instrucciones</p>
              <ol className="text-xs text-text-muted space-y-2 text-left max-w-xs mx-auto">
                <li>1. El influencer llega a tu negocio</li>
                <li>2. Muestra su Midi Pass digital</li>
                <li>3. Escanea este QR con su teléfono</li>
                <li>4. El sistema confirma el check-in</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <QrCode size={40} className="text-text-muted mx-auto mb-4" />
            <p className="text-sm text-text-muted">Tu QR se generará cuando publiques tu oferta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
