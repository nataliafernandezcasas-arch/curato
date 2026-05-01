"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import MidiLogo from "@/components/midi-logo";
import { MapPin, Phone, InstagramLogo, CheckCircle } from "@phosphor-icons/react";

type Offer = {
  id: string;
  title: string;
  description: string;
  category: string;
  address: string;
  reservation_phone: string;
  photos: string[];
  visit_value_cop: number;
  available_hours: string;
  comercios: { name: string } | null;
};

type Profile = {
  full_name: string | null;
  handle: string | null;
  monthly_credit_cop: number | null;
  credit_used_cop: number | null;
};

const CAT_LABELS: Record<string, string> = { gastronomy: "Gastronomía", beauty: "Beauty", wellness: "Wellness", hospitality: "Hospedaje" };

export default function InfluencerDashboard() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [catFilter, setCatFilter] = useState("all");
  const [igConnected, setIgConnected] = useState(false);
  const [connectingIg, setConnectingIg] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: creator } = await supabase
        .from("creators")
        .select("full_name, handle, monthly_credit_cop, credit_used_cop, instagram_connected")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (creator) {
        setProfile({
          full_name: creator.full_name,
          handle: creator.handle,
          monthly_credit_cop: creator.monthly_credit_cop,
          credit_used_cop: creator.credit_used_cop,
        });
        if (creator.instagram_connected) setIgConnected(true);
      }

      let q = supabase.from("offers").select("*, comercios(name)").eq("is_active", true);
      if (catFilter !== "all") q = q.eq("category", catFilter);
      const { data: o } = await q.order("created_at", { ascending: false });
      setOffers((o || []) as unknown as Offer[]);
      setLoading(false);
    }
    load();
  }, [catFilter]);

  const connectInstagram = useCallback(async () => {
    setConnectingIg(true);
    try {
      // Get current user email
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { alert("No se pudo obtener tu email. Inicia sesión de nuevo."); setConnectingIg(false); return; }

      const res = await fetch("/api/phyllo/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();

      if (!res.ok || !data.sdk_token) {
        console.error("Phyllo API error:", data);
        alert(data.error || "Error conectando Instagram. Intenta de nuevo.");
        setConnectingIg(false);
        return;
      }

      // Load Phyllo Connect SDK
      const config = {
        clientDisplayName: "Midi Pass",
        environment: "staging",
        userId: data.user_id,
        token: data.sdk_token,
        workPlatformId: "9bb8913b-ddd9-430b-a66a-d74d846e6c66", // Instagram
      };

      const initPhyllo = () => {
        // @ts-expect-error Phyllo SDK
        const phylloConnect = window.PhylloConnect.initialize(config);
        phylloConnect.on("accountConnected", (accountId: string, workplatformId: string, userId: string) => {
          console.log("IG connected:", accountId, workplatformId, userId);
          setIgConnected(true);
          setConnectingIg(false);
        });
        phylloConnect.on("accountDisconnected", (accountId: string, workplatformId: string, userId: string) => {
          console.log("IG disconnected:", accountId, workplatformId, userId);
        });
        phylloConnect.on("tokenExpired", (userId: string) => {
          console.log("Token expired for:", userId);
          setConnectingIg(false);
        });
        phylloConnect.on("exit", (reason: string, userId: string) => {
          console.log("Phyllo exit:", reason, userId);
          setConnectingIg(false);
        });
        phylloConnect.open();
      };

      // @ts-expect-error Phyllo SDK loaded externally
      if (window.PhylloConnect) {
        initPhyllo();
      } else {
        const script = document.createElement("script");
        script.src = "https://cdn.getphyllo.com/connect/v2/phyllo-connect.js";
        script.onload = initPhyllo;
        script.onerror = () => {
          alert("Error cargando el SDK de Phyllo.");
          setConnectingIg(false);
        };
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error(err);
      setConnectingIg(false);
    }
  }, []);

  const monthlyCredit = profile?.monthly_credit_cop ?? 1500000;
  const usedCredit = profile?.credit_used_cop ?? 0;
  const remaining = monthlyCredit - usedCredit;
  const pillClass = (active: boolean) => `px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-300 ${active ? "bg-text-primary text-white" : "text-text-muted hover:text-text-primary hover:bg-surface-hover"}`;

  return (
    <div className="min-h-[100dvh] bg-surface">
      <nav className="border-b border-border bg-surface/80 backdrop-blur-xl px-5 h-14 flex items-center">
        <div className="max-w-[1200px] mx-auto w-full flex items-center justify-between">
          <Link href="/" aria-label="Midi Pass" className="flex items-center gap-2 text-text-primary">
            <MidiLogo className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight leading-none">Pass</span>
          </Link>
          <div className="flex gap-5 text-[13px] font-medium">
            <Link href="/dashboard/influencer" className="text-text-primary">Ofertas</Link>
            <Link href="/dashboard/influencer/visits" className="text-text-muted hover:text-text-primary transition-colors">Mis Visitas</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-5 py-10">
        {/* Credit banner */}
        {profile && (
          <div className="border border-accent/15 bg-accent/5 rounded-xl p-6 mb-10 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Hola, {profile.full_name || profile.handle || "creador"}</p>
              <p className="text-lg font-bold text-text-primary tracking-tighter mt-1">Crédito disponible</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-accent tracking-tight">${remaining.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">de ${monthlyCredit.toLocaleString()} COP</p>
            </div>
          </div>
        )}

        {/* Instagram connection */}
        {!igConnected && (
          <div className="border border-midi-orange/15 bg-midi-orange/5 rounded-xl p-5 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <InstagramLogo size={24} weight="duotone" className="text-midi-orange" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Conecta tu Instagram</p>
                <p className="text-xs text-text-muted">Para verificar tu contenido automáticamente después de cada visita.</p>
              </div>
            </div>
            <button onClick={connectInstagram} disabled={connectingIg} className="text-[12px] font-semibold text-white bg-text-primary px-4 py-2 rounded-lg hover:bg-accent transition-all duration-300 active:scale-[0.97] disabled:opacity-50 shrink-0">
              {connectingIg ? "Conectando..." : "Conectar"}
            </button>
          </div>
        )}
        {igConnected && (
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle size={20} weight="fill" className="text-green-600" />
            <p className="text-sm text-green-700 font-medium">Instagram conectado — tu contenido se verifica automáticamente.</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-1 mb-8">
          {["all", "gastronomy", "beauty", "wellness", "hospitality"].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className={pillClass(catFilter === c)}>
              {c === "all" ? "Todas" : CAT_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Offers */}
        {loading ? (
          <p className="text-sm text-text-muted py-12 text-center">Cargando ofertas...</p>
        ) : offers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-text-muted mb-1">No hay ofertas disponibles.</p>
            <p className="text-xs text-text-muted">Pronto habra comercios para visitar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer) => (
              <div key={offer.id} className="border border-border rounded-xl overflow-hidden hover:border-accent/20 transition-all duration-400 group">
                <div className="aspect-[4/3] bg-surface-hover relative overflow-hidden">
                  {offer.photos?.[0] ? (
                    <img src={offer.photos[0]} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">{CAT_LABELS[offer.category]}</div>
                  )}
                  <span className="absolute top-3 left-3 text-[9px] font-bold text-white bg-text-primary/70 backdrop-blur-sm px-2 py-0.5 rounded uppercase tracking-wide">
                    {CAT_LABELS[offer.category]}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="text-[15px] font-semibold text-text-primary mb-1 group-hover:text-accent transition-colors">{offer.title}</h3>
                  <p className="text-xs text-text-muted mb-3">{offer.comercios?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-text-muted mb-4">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {offer.address}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-accent">Hasta ${offer.visit_value_cop.toLocaleString()}</span>
                    <a href={`https://wa.me/${offer.reservation_phone?.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-primary bg-surface-hover px-3 py-1.5 rounded-lg hover:bg-accent hover:text-white transition-all duration-300 active:scale-[0.97]">
                      <Phone size={12} /> Reservar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
