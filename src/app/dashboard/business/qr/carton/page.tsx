"use client";

import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { mostrarCodigo } from "@/lib/check-in";

type Datos = { maison: string; code: string; url: string };

/**
 * El cartón para el mostrador: tinta oscura sobre papel claro, que es lo que
 * lee cualquier lector de QR. Un cartón posado evita sacar el teléfono en cada
 * visita, y es la red de seguridad del QR claro sobre oscuro de la pantalla.
 */
export default function CartonPage() {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    fetch("/api/maison/qr", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setDatos)
      .catch(() => setFallo(true));
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-[#1E1E1E] print:static">
      <div className="mx-auto flex min-h-full max-w-[480px] flex-col items-center px-pagina py-rango text-center">
        <div className="mb-rango flex w-full justify-between print:hidden">
          <a href="/dashboard/business/qr" className="min-h-11 text-capitale uppercase tracking-capitale text-[#6B5B3E]">
            Retour
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!datos}
            className="min-h-11 text-capitale uppercase tracking-capitale text-[#6B5B3E] disabled:opacity-40"
          >
            Imprimer
          </button>
        </div>

        {fallo && <p className="text-corps">Le carton ne s&apos;est pas chargé. Réessayez dans un instant.</p>}

        {datos && (
          <div className="flex flex-col items-center border border-[#1E1E1E]/20 px-rango py-seccion">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-curato-simple.png" alt="Curato" className="mb-rango h-4 w-auto invert" />
            <p className="text-capitale uppercase tracking-capitale">Visite Curato</p>
            <h1 className="mt-bloque text-titre uppercase tracking-titre">{datos.maison}</h1>
            <div className="my-rango bg-white p-bloque">
              <QRCode value={datos.url} size={220} fgColor="#1E1E1E" bgColor="#FFFFFF" level="M" />
            </div>
            <p className="max-w-[30ch] text-corps">
              Scannez ce code avec l&apos;appareil photo de votre téléphone pour enregistrer votre visite.
            </p>
            <p className="mt-fila text-legende">Ou saisissez le code sur curatocollective.com/v</p>
            <p className="mt-bloque text-[28px] tracking-[0.2em] tabular-nums">{mostrarCodigo(datos.code)}</p>
            <p className="mt-rango text-legende italic opacity-70">
              Scan with your phone camera to record your Curato visit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
