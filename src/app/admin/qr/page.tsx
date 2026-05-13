"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";

const QRS = [
  { label: "Homepage", url: "https://curatocollective.com", filename: "curato-homepage-qr" },
  { label: "Invitación", url: "https://curatocollective.com/invitacion", filename: "curato-invitation-qr" },
];

function QRBlock({ label, url, filename }: { label: string; url: string; filename: string }) {
  const ref = useRef<HTMLDivElement>(null);

  function downloadSVG() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.svg`;
    a.click();
  }

  function downloadPNG() {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const size = 800;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const padding = 60;
      ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `${filename}.png`;
      a.click();
    };
    img.src = url;
  }

  return (
    <div>
      <p className="font-serif text-[10px] tracking-[0.35em] uppercase text-champagne/50 mb-5">{label}</p>

      <div className="bg-white/8 border border-white/10 p-10 inline-block">
        <div ref={ref}>
          <QRCode
            value={url}
            size={220}
            bgColor="transparent"
            fgColor="#CBB78F"
            level="H"
          />
        </div>
      </div>

      <p className="font-serif text-[11px] text-white/30 mt-3 mb-5 tracking-wide">{url}</p>

      <div className="flex gap-3">
        <button
          onClick={downloadPNG}
          className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-5 py-2.5 hover:bg-copper hover:text-white transition-all duration-200"
        >
          PNG
        </button>
        <button
          onClick={downloadSVG}
          className="font-serif text-[11px] tracking-widest uppercase text-white/50 border border-white/20 px-5 py-2.5 hover:border-white/40 hover:text-white transition-all duration-200"
        >
          SVG
        </button>
      </div>
    </div>
  );
}

export default function AdminQRPage() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 py-16">
      <div className="mb-12">
        <p className="font-serif text-[11px] tracking-[0.35em] uppercase text-champagne/50 mb-3">Admin · QR Codes</p>
        <h1 className="font-serif text-3xl font-light tracking-[0.2em] uppercase text-white">Codes QR</h1>
        <p className="font-serif text-[13px] font-light text-white/30 mt-2">Beige champagne · fond transparent · 800×800 px</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
        {QRS.map((qr) => (
          <QRBlock key={qr.url} {...qr} />
        ))}
      </div>
    </div>
  );
}
