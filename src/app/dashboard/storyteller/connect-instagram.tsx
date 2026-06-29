"use client";

import { useState } from "react";
import { InstagramLogo, CheckCircle } from "@phosphor-icons/react";

const SDK_SRC = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";
const PHYLLO_ENV = "staging"; // must match the Phyllo account environment (Staging)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PhylloConnect = any;

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).PhylloConnect) return resolve();
    const existing = document.querySelector(`script[src="${SDK_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("sdk")));
      return;
    }
    const s = document.createElement("script");
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("sdk"));
    document.body.appendChild(s);
  });
}

export default function ConnectInstagram({ connected }: { connected: boolean }) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    connected ? "done" : "idle"
  );
  const [error, setError] = useState("");

  async function connect() {
    setStatus("loading");
    setError("");
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const { data: { user } } = await createClient().auth.getUser();
      if (!user?.email) {
        setError("Session expirée. Reconnectez-vous.");
        setStatus("error");
        return;
      }

      const res = await fetch("/api/phyllo/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, phyllo_consent: true }),
      });
      const data = await res.json();
      if (!res.ok || !data.sdk_token) {
        setError(data.error || "Erreur lors de l'initialisation.");
        setStatus("error");
        return;
      }

      await loadSdk();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pc: PhylloConnect = (window as any).PhylloConnect.initialize({
        environment: PHYLLO_ENV,
        userId: data.user_id,
        token: data.sdk_token,
        clientDisplayName: "Curato",
      });

      // Phyllo validates the callback arity, so declare every parameter even if
      // unused (accountConnected → 3, exit → 2, connectionFailure → 3).
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pc.on("accountConnected", async (_accountId: string, _workPlatformId: string, _userId: string) => {
        try {
          await fetch("/api/phyllo/sync-engagement", { method: "POST" });
        } catch {
          /* engagement sync is best-effort */
        }
        setStatus("done");
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pc.on("accountDisconnected", (_accountId: string, _workPlatformId: string, _userId: string) => {});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pc.on("tokenExpired", (_userId: string) => {});
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pc.on("exit", (_reason: string, _userId: string) => setStatus((s) => (s === "done" ? s : "idle")));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      pc.on("connectionFailure", (_reason: string, _workPlatformId: string, _userId: string) => {
        setError("La connexion a échoué. Réessayez.");
        setStatus("error");
      });

      pc.open();
    } catch (e) {
      console.error("Phyllo connect error:", e);
      setError(`Erreur: ${e instanceof Error ? e.message : String(e)}`);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="border border-champagne/20 bg-champagne/5 px-6 py-4 mb-10 flex items-center gap-3">
        <CheckCircle size={18} weight="thin" className="text-champagne shrink-0" />
        <p className="font-serif text-[13px] font-light text-white/70">
          Votre Instagram est connecté. Merci !
        </p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-black/20 px-6 py-5 mb-10">
      <div className="flex items-start gap-3 mb-4">
        <InstagramLogo size={20} weight="thin" className="text-champagne shrink-0 mt-0.5" />
        <div>
          <p className="font-serif text-[14px] text-white mb-1">Connectez votre Instagram</p>
          <p className="font-serif text-[12px] font-light text-white/60 leading-relaxed">
            Pour valider votre profil, reliez votre compte Instagram en toute sécurité via Phyllo.
          </p>
        </div>
      </div>

      <label className="flex items-start gap-2 mb-4 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 accent-champagne"
        />
        <span className="font-serif text-[11px] font-light text-white/60 leading-relaxed">
          J'autorise Curato à accéder aux données publiques de mon compte (abonnés, engagement)
          via Phyllo, conformément à la politique de confidentialité.
        </span>
      </label>

      {error && (
        <p className="font-serif text-[12px] text-copper/80 mb-3 border-l border-copper/40 pl-3">
          {error}
        </p>
      )}

      <button
        onClick={connect}
        disabled={!consent || status === "loading"}
        className="font-serif text-[11px] tracking-widest uppercase text-charcoal-deep bg-champagne px-6 py-3 hover:bg-copper hover:text-white transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Connexion…" : "Connecter mon Instagram"}
      </button>
    </div>
  );
}
