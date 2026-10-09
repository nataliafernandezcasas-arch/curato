import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { filtroDeUsuario } from "@/lib/identidad";
import { visitaDeHoy } from "@/lib/check-in";
import { eventoDeVisita, googleCalendarUrl } from "@/lib/calendar";
import { enlaceIcs } from "@/lib/calendar-enlaces";
import { creditoDelMes, mesDeParis } from "@/lib/credito";
import { asistenciaConfirmada } from "@/lib/asistencia";
import { bloqueaReservas, sumarCifras, type CifrasStory } from "@/lib/validacion";
import type { CasaTarjeta } from "@/components/member/tarjeta-casa";

const BUCKET = "content-proofs";
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
// Una foto de iPhone pesa de 2 a 8 MB; un HEIC convertido, algo más. Un vídeo
// de 30 s (lo más que se admite, migración 047) puede pasar de 100 MB en 4K.
const FOTO_MAX_BYTES = 25 * 1024 * 1024;
const VIDEO_MAX_BYTES = 200 * 1024 * 1024;
const EXT_VIDEO: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-m4v": "m4v",
  "video/webm": "webm",
};

// List the signed-in creator's reservations with maison names + signed photo
// URLs (generated server-side because the content bucket is private).
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    const admin = createAdminClient();
    const { data: creator } = await admin
      .from("creators")
      .select("id, full_name, handle")
      .or(filtroDeUsuario(user))
      .maybeSingle();
    if (!creator) return NextResponse.json({ visits: [] });

    const { data: reservations } = await admin
      .from("reservations")
      .select("id, venue_id, slot_start, slot_end, nights, party_size, status, visited_at, content_photo_paths, content_rights_expires_at, reach_views, reach_accounts, reach_interactions, reach_declared_at, credits_cost, created_at")
      .eq("creator_id", creator.id)
      .order("slot_start", { ascending: false });

    const rows = reservations ?? [];
    const venueIds = [...new Set(rows.map((r) => r.venue_id))];
    // Lo de la casa que enseña su tarjeta, la misma que en Adresses.
    const { data: venues } = await admin
      .from("comercios")
      .select("id, name, address, arrondissement, description, description_en, description_es, photos, signed_at, category_id, offer_eur")
      .in("id", venueIds);
    const casaDe = new Map((venues ?? []).map((v) => [v.id as string, v as CasaTarjeta]));
    // La asistencia (migración 046), aparte y tolerante.
    const { data: asistencias, error: sinAsistencia } = await admin
      .from("reservations")
      .select("id, asistencia_confirmada_at, cancelada_tarde")
      .eq("creator_id", creator.id);
    const asistenciaDe = new Map(
      sinAsistencia ? [] : (asistencias ?? []).map((a) => [a.id as string, a as { asistencia_confirmada_at: string | null; cancelada_tarde: boolean | null }])
    );
    // La portée de cada story (migración 048), aparte y tolerante.
    const { data: porStory, error: sinPorStory } = await admin
      .from("reservations")
      .select("id, reach_stories")
      .eq("creator_id", creator.id);
    const storiesDe = new Map(
      sinPorStory ? [] : (porStory ?? []).map((x) => [x.id as string, (x.reach_stories as CifrasStory[] | null) ?? []])
    );
    // El crédito del mes en curso: cuánto tiene y cuánto le queda.
    const credito = await creditoDelMes(admin, creator.id as string, mesDeParis(new Date()));
    const venueName = new Map((venues ?? []).map((v) => [v.id, v.name as string]));
    const venueAddress = new Map((venues ?? []).map((v) => [v.id, (v.address as string | null) ?? null]));
    const ahora = Date.now();

    const visits = await Promise.all(
      rows.map(async (r) => {
        const paths: string[] = r.content_photo_paths ?? [];
        const photos: string[] = [];
        // Cada foto con su ruta: las cifras de cada story se guardan por ruta.
        const media: { url: string; path: string }[] = [];
        for (const p of paths) {
          const { data } = await admin.storage.from(BUCKET).createSignedUrl(p, 3600);
          if (data?.signedUrl) {
            photos.push(data.signedUrl);
            media.push({ url: data.signedUrl, path: p });
          }
        }
        const stories = storiesDe.get(r.id as string) ?? [];
        const asistencia = asistenciaDe.get(r.id as string);
        const futura = new Date(r.slot_start as string).getTime() > ahora;
        return {
          id: r.id as string,
          maison: venueName.get(r.venue_id) ?? "—",
          casa: casaDe.get(r.venue_id) ?? null,
          // Lo que la visita gasta del crédito (la oferta de la casa).
          cost: (r.credits_cost as number | null) ?? 0,
          // Una cancelada tarde gasta su crédito igual.
          lateCancel: Boolean(asistencia?.cancelada_tarde),
          // Confirmar que va: solo una visita aceptada, futura y reservada con
          // más de 24 h que aún no se confirmó.
          mustConfirm:
            !sinAsistencia &&
            r.status === "confirmed" &&
            futura &&
            !asistenciaConfirmada({
              slot_start: r.slot_start as string,
              created_at: r.created_at as string,
              asistencia_confirmada_at: asistencia?.asistencia_confirmada_at ?? null,
            }),
          canCancel: (r.status === "confirmed" || r.status === "pending_review") && futura,
          slotStart: r.slot_start as string,
          status: r.status as string,
          // Hoy es el día de la visita: es cuando hay código que enseñar.
          today: Boolean(visitaDeHoy([r])),
          visitedAt: (r.visited_at as string | null) ?? null,
          partySize: (r.party_size as number | null) ?? 1,
          // Para apuntarla en su calendario: solo una visita confirmada que
          // todavía no ha pasado.
          calendar:
            r.status === "confirmed" && new Date(r.slot_end ?? r.slot_start).getTime() > ahora - 3 * 3600000
              ? {
                  google: googleCalendarUrl(
                    eventoDeVisita({
                      lado: "storyteller",
                      maison: venueName.get(r.venue_id) ?? "Curato",
                      address: venueAddress.get(r.venue_id) ?? null,
                      storyteller: (creator.full_name as string | null) ?? "",
                      handle: (creator.handle as string | null) ?? null,
                      slotStart: r.slot_start as string,
                      nights: (r.nights as number | null) ?? null,
                      partySize: (r.party_size as number | null) ?? 1,
                    })
                  ),
                  ics: enlaceIcs(r.id as string, "storyteller"),
                }
              : null,
          photos,
          media,
          stories,
          // Entregada: todas sus stories con sus tres cifras. Sin la migración
          // 048 no se puede saber, y no se bloquea a nadie.
          pending: !sinPorStory && bloqueaReservas({
            status: r.status as string,
            slot_start: r.slot_start as string,
            content_photo_paths: paths,
            reach_stories: stories,
          }),
          rightsExpiresAt: (r.content_rights_expires_at as string | null) ?? null,
          reach: r.reach_declared_at
            ? {
                views: r.reach_views as number | null,
                accounts: r.reach_accounts as number | null,
                interactions: r.reach_interactions as number | null,
              }
            : null,
        };
      })
    );

    return NextResponse.json({ visits, credito });
  } catch (err) {
    console.error("my-visits error:", err);
    return NextResponse.json({ error: "Erreur." }, { status: 500 });
  }
}

// Creator marks a reservation as visited and (optionally) uploads HD photos.
// Photos are stored in a private bucket; the maison gets 90 days of access.
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

    // Dos formas de llegar. La de siempre (FormData con las fotos dentro) solo
    // sirve ya para la portée sin fotos: Vercel corta cualquier petición de
    // más de 4,5 MB, y dos fotos de iPhone la superan, así que la subida fallaba.
    // Las fotos van ahora directas del teléfono al almacenamiento, en JSON:
    //   1. { reservationId, subir: [{ type, size }] } → un permiso por foto;
    //   2. el navegador sube cada foto con su permiso;
    //   3. { reservationId, paths: [...] } → se registran en la visita.
    const esJson = (request.headers.get("content-type") ?? "").includes("application/json");
    const json = esJson
      ? ((await request.json().catch(() => ({}))) as {
          reservationId?: string;
          subir?: { type?: string; size?: number }[];
          paths?: unknown;
          reachViews?: unknown;
          reachAccounts?: unknown;
          reachInteractions?: unknown;
          stories?: unknown;
        })
      : null;
    const form = esJson ? null : await request.formData();
    const reservationId = (json ? json.reservationId : (form!.get("reservationId") as string | null)) ?? null;
    const files = form ? (form.getAll("files") as File[]) : [];
    // La portée: se archivaban capturas y no se guardaba ni una cifra, así que
    // no había forma de decirle a una maison a cuánta gente llegó.
    const cifra = (campo: "reachViews" | "reachAccounts" | "reachInteractions") => {
      const raw = json ? json[campo] : form!.get(campo);
      if (raw === null || raw === undefined || raw === "") return null;
      const n = Number(String(raw).replace(/\s/g, ""));
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
    };
    const vues = cifra("reachViews");
    const comptes = cifra("reachAccounts");
    const interactions = cifra("reachInteractions");
    if (!reservationId) {
      return NextResponse.json({ error: "Réservation manquante." }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the reservation belongs to this creator.
    const { data: creator } = await admin
      .from("creators")
      .select("id")
      .or(filtroDeUsuario(user))
      .maybeSingle();
    if (!creator) return NextResponse.json({ error: "Profil introuvable." }, { status: 404 });

    const { data: reservation } = await admin
      .from("reservations")
      .select("id, creator_id, status, slot_start, content_photo_paths, visited_at, content_uploaded_at, content_rights_expires_at")
      .eq("id", reservationId)
      .maybeSingle();
    if (!reservation || reservation.creator_id !== creator.id) {
      return NextResponse.json({ error: "Réservation introuvable." }, { status: 404 });
    }

    // Declarar la portée marca la visita como hecha, así que solo se puede
    // hacer con una visita que existió: confirmada (o ya terminada, para
    // corregir cifras) y con la fecha pasada. Sin esto, una reserva rechazada
    // revivía como terminada, y una confirmada para la semana que viene se
    // cerraba hoy: el recordatorio de las seis horas solo mira las
    // confirmadas, así que después de eso las dos stories dejaban de
    // exigirse.
    if (reservation.status !== "confirmed" && reservation.status !== "completed") {
      return NextResponse.json({ error: "Cette visite n'est pas confirmée." }, { status: 409 });
    }
    if (new Date(reservation.slot_start as string).getTime() > Date.now()) {
      return NextResponse.json({ error: "Cette visite n'a pas encore eu lieu." }, { status: 409 });
    }

    const carpeta = `reservations/${reservationId}/`;

    // La portée de cada story (migración 048): las tres cifras de cada
    // captura subida. Se guardan las de cada una y, en las columnas de
    // siempre, la suma, que es lo que lee el informe de la casa.
    if (json && Array.isArray(json.stories)) {
      const subidas: string[] = reservation.content_photo_paths ?? [];
      const num = (v: unknown) => {
        if (v === null || v === undefined || v === "") return null;
        const n = Number(String(v).replace(/\s/g, ""));
        return Number.isFinite(n) && n >= 0 ? Math.round(n) : null;
      };
      const stories: CifrasStory[] = (json.stories as Record<string, unknown>[])
        .filter((x) => typeof x?.path === "string" && subidas.includes(x.path as string))
        .map((x) => ({
          path: x.path as string,
          views: num(x.views),
          accounts: num(x.accounts),
          interactions: num(x.interactions),
        }));
      const total = sumarCifras(stories);
      const { error: e } = await admin
        .from("reservations")
        .update({
          reach_stories: stories,
          reach_views: total.views,
          reach_accounts: total.accounts,
          reach_interactions: total.interactions,
          reach_source: "manual",
          reach_declared_at: new Date().toISOString(),
        })
        .eq("id", reservationId);
      if (e) return NextResponse.json({ error: "save" }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    // Paso 1 de la subida directa: un permiso firmado por foto.
    if (json && Array.isArray(json.subir)) {
      const permisos: { path: string; token: string }[] = [];
      for (const f of json.subir.slice(0, 20)) {
        const tipo = (f.type ?? "").toLowerCase();
        const video = EXT_VIDEO[tipo];
        if (!tipo.startsWith("image/") && !video) return NextResponse.json({ error: "format" }, { status: 415 });
        if (!f.size || f.size > (video ? VIDEO_MAX_BYTES : FOTO_MAX_BYTES)) {
          return NextResponse.json({ error: "size" }, { status: 413 });
        }
        // La extensión dice después si es foto o vídeo (src/lib/medio.ts).
        const ext = video ?? (tipo.split("/")[1]?.replace("jpeg", "jpg").replace(/[^a-z0-9]/g, "") || "jpg");
        const path = `${carpeta}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data, error } = await admin.storage.from(BUCKET).createSignedUploadUrl(path);
        if (error || !data) {
          console.error("Visit photo signed URL error:", error);
          return NextResponse.json({ error: "upload" }, { status: 500 });
        }
        permisos.push({ path: data.path, token: data.token });
      }
      return NextResponse.json({ permisos });
    }

    // Paso 3: las ya subidas. Solo rutas de la carpeta de esta visita: llegan
    // del navegador.
    const subidas = json && Array.isArray(json.paths)
      ? (json.paths as unknown[]).filter((p): p is string => typeof p === "string" && p.startsWith(carpeta) && !p.includes(".."))
      : [];

    // At least 2 photos are required on the first upload (logging the visit).
    const existing: string[] = reservation.content_photo_paths ?? [];
    const incoming = files.filter((f) => f && typeof f.arrayBuffer === "function");
    const conFotos = incoming.length + subidas.length;
    if (existing.length === 0 && conFotos < 2) {
      return NextResponse.json({ error: "Au moins 2 photos sont requises." }, { status: 400 });
    }

    // Upload provided photos.
    const newPaths: string[] = [...subidas];
    for (const file of incoming) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `reservations/${reservationId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: upErr } = await admin.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
      if (upErr) {
        console.error("Visit photo upload error:", upErr);
        continue;
      }
      newPaths.push(path);
    }

    const allPaths = [...(reservation.content_photo_paths ?? []), ...newPaths];
    const now = new Date();

    const update: Record<string, unknown> = {
      status: "completed",
      visited_at: reservation.visited_at ?? now.toISOString(),
    };
    if (newPaths.length > 0) {
      update.content_photo_paths = allPaths;
      // Los 90 días cuentan desde la primera subida y no se mueven: si cada
      // foto añadida reiniciara el plazo, la exclusividad de la casa se
      // alargaría sin fin y el aviso de fin de derechos nunca llegaría.
      if (!reservation.content_rights_expires_at) {
        const subida = reservation.content_uploaded_at ? new Date(reservation.content_uploaded_at) : now;
        update.content_uploaded_at = subida.toISOString();
        update.content_rights_expires_at = new Date(subida.getTime() + NINETY_DAYS_MS).toISOString();
      }
    }
    if (vues !== null || comptes !== null || interactions !== null) {
      if (vues !== null) update.reach_views = vues;
      if (comptes !== null) update.reach_accounts = comptes;
      if (interactions !== null) update.reach_interactions = interactions;
      // De momento siempre a mano. Cuando Phyllo devuelva la portée por story,
      // ese camino escribirá 'phyllo' y estas cifras dejarán de teclearse.
      update.reach_source = "manual";
      update.reach_declared_at = now.toISOString();
    }

    const { error: updErr } = await admin.from("reservations").update(update).eq("id", reservationId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    // Return short-lived signed URLs for immediate display.
    const urls: string[] = [];
    for (const p of allPaths) {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(p, 3600);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }

    return NextResponse.json({ ok: true, photos: urls, count: allPaths.length });
  } catch (err) {
    console.error("Reservation visit error:", err);
    return NextResponse.json({ error: "Erreur lors de l'envoi." }, { status: 500 });
  }
}
