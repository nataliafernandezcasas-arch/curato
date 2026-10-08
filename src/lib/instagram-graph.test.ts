import { describe, expect, it } from "vitest";
import { limpiarHandle } from "./instagram-graph";

describe("el @ de Instagram", () => {
  it("acepta el @, el enlace o el nombre tal cual", () => {
    expect(limpiarHandle("@Na2styoa")).toBe("na2styoa");
    expect(limpiarHandle("https://www.instagram.com/na2styoa/?hl=fr")).toBe("na2styoa");
    expect(limpiarHandle(" na2styoa ")).toBe("na2styoa");
  });
});

import { afterEach, vi } from "vitest";
import { perfilPublico } from "./instagram-graph";

describe("lo que responde Instagram", () => {
  afterEach(() => vi.unstubAllGlobals());
  const responde = (body: unknown) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })));

  it("seguidores y fotos; de un vídeo, su portada", async () => {
    responde({
      business_discovery: {
        followers_count: 71234,
        media: {
          data: [
            { permalink: "https://instagram.com/p/a", media_type: "IMAGE", media_url: "https://cdn/a.jpg", timestamp: "2026-10-01" },
            { permalink: "https://instagram.com/p/b", media_type: "VIDEO", media_url: "https://cdn/b.mp4", thumbnail_url: "https://cdn/b.jpg" },
          ],
        },
      },
    });
    const r = await perfilPublico("@na2styoa");
    expect(r.ok && r.followers).toBe(71234);
    expect(r.ok && r.posts.map((p) => p.imagen)).toEqual(["https://cdn/a.jpg", "https://cdn/b.jpg"]);
  });

  it("una cuenta personal se dice como tal, no como un fallo", async () => {
    responde({ error: { code: 110, message: "Cannot find User", error_subcode: 2207013 } });
    const r = await perfilPublico("alguien");
    expect(!r.ok && r.error).toBe("personal");
  });

  it("un token caducado se distingue", async () => {
    responde({ error: { code: 190, message: "Error validating access token" } });
    const r = await perfilPublico("alguien");
    expect(!r.ok && r.error).toBe("token");
  });
});
