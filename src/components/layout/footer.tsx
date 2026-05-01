import Link from "next/link";
import MidiLogo from "../midi-logo";

export default function Footer() {
  return (
    <footer className="border-t border-border py-10 px-5 bg-surface">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <span className="flex items-center gap-1.5 text-text-primary">
            <MidiLogo className="h-5 w-auto" />
            <span className="text-base font-semibold tracking-tight leading-none">Pass</span>
          </span>
          <div className="flex gap-5 text-[11px] text-text-muted">
            <Link href="/creadores" className="hover:text-text-primary transition-colors">Creadores</Link>
            <Link href="/comercios" className="hover:text-text-primary transition-colors">Comercios</Link>
            <Link href="/influencers" className="hover:text-text-primary transition-colors">Aplicar</Link>
          </div>
        </div>
        <div className="border-t border-border pt-6 space-y-2">
          <p className="text-[10px] text-text-muted leading-relaxed max-w-2xl">
            Midi Pass es una iniciativa de Midi Technologies LLC, la primera Fintech creada para la creator economy que te permite cobrar en USD a empresas en Estados Unidos de forma clara y confiable.
          </p>
          <p className="text-[9px] text-text-muted/60 leading-relaxed max-w-2xl italic">
            Midi es una plataforma tecnológica desarrollada por Midi Technologies LLC. Los servicios financieros accesibles a través de la app Midi son ofrecidos exclusivamente por Banco San Juan Internacional Inc., una institución financiera regulada en Puerto Rico.
          </p>
        </div>
      </div>
    </footer>
  );
}
