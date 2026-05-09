"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";

const INVITATION_URL = "https://curatocollective.com/invitacion";

export default function AdminQRPage() {
  const qrRef = useRef<HTMLDivElement>(null);

  function downloadSVG() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "curato-invitation-qr.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPNG() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const size = 800;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const serializer = new XMLSerializer();
    const svgStr = serializer.serializeToString(svg);
    const img = new Image();
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      // Transparent background — no fillRect
      const padding = 60;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "curato-invitation-qr.png";
      a.click();
    };
    img.src = url;
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 py-16">
      <div className="mb-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-charcoal-deep/40 mb-3">Admin · Invitaciones</p>
        <h1 className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-charcoal-deep">QR de invitación</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        {/* QR display — dark background so the beige QR is visible */}
        <div>
          <div className="bg-[#1A1A1A] p-10 inline-block">
            <div ref={qrRef}>
              <QRCode
                value={INVITATION_URL}
                size={260}
                bgColor="transparent"
                fgColor="#CBB78F"
                level="H"
              />
            </div>
          </div>

          <p className="font-serif text-[11px] text-charcoal-deep/40 mt-3 tracking-wide">
            Previsualización sobre fondo oscuro · el QR es transparente
          </p>

          {/* Download buttons */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={downloadPNG}
              className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-200"
            >
              Descargar PNG
            </button>
            <button
              onClick={downloadSVG}
              className="font-serif text-[12px] tracking-widest uppercase text-charcoal-deep/70 border border-black/20 px-6 py-3 hover:border-black/40 transition-all duration-200"
            >
              Descargar SVG
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-8 pt-2">
          <div>
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-charcoal-deep/30 mb-2">URL de destino</p>
            <p className="font-serif text-[14px] font-light text-charcoal-deep break-all">{INVITATION_URL}</p>
          </div>

          <div className="h-px bg-black/8" />

          <div>
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-charcoal-deep/30 mb-3">Uso recomendado</p>
            <ul className="space-y-2">
              {[
                "Color beige champagne, fondo transparente — se adapta a cualquier papel",
                "Imprimir sobre fondo oscuro o crema para mayor contraste",
                "PNG 800×800 con fondo transparente, listo para imprenta",
                "SVG vectorial para escalado sin pérdida de calidad",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-champagne mt-1 flex-shrink-0">·</span>
                  <span className="font-serif text-[13px] font-light text-charcoal-deep/60">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="h-px bg-black/8" />

          <div>
            <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-charcoal-deep/30 mb-2">Página de destino</p>
            <p className="font-serif text-[13px] font-light text-charcoal-deep/50 leading-relaxed">
              El QR lleva a <span className="text-charcoal-deep">/invitacion</span> — mensaje de bienvenida y opción para escribir a Curato para coordinar una visita.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
