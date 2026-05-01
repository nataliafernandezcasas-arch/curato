import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const visitId = formData.get("visitId") as string;
    const email = formData.get("email") as string;
    const files = formData.getAll("files") as File[];

    if (!visitId || !email || files.length === 0) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify visit belongs to this creator
    const { data: creator } = await admin.from("creators").select("id").eq("email", email.toLowerCase()).single();
    if (!creator) return NextResponse.json({ error: "Creator no encontrado" }, { status: 404 });

    const { data: visit } = await admin.from("visits").select("id, status").eq("id", visitId).eq("creator_id", creator.id).single();
    if (!visit) return NextResponse.json({ error: "Visita no encontrada" }, { status: 404 });

    // Upload files to Supabase Storage
    const uploadedUrls: string[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${visitId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadError } = await admin.storage
        .from("content-proofs")
        .upload(fileName, buffer, { contentType: file.type, upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        continue;
      }

      const { data: urlData } = admin.storage.from("content-proofs").getPublicUrl(fileName);
      if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json({ error: "No se pudieron subir los archivos" }, { status: 500 });
    }

    // Update visit
    await admin.from("visits").update({
      status: "content_submitted",
      content_submitted_at: new Date().toISOString(),
      content_proof_urls: uploadedUrls,
      content_notes: "Subido manualmente por el influencer",
    }).eq("id", visitId);

    return NextResponse.json({ success: true, urls: uploadedUrls });
  } catch (err) {
    console.error("Upload proof error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
