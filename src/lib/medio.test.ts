import { describe, expect, it } from "vitest";
import { esVideo } from "./medio";

describe("foto o vídeo", () => {
  it("se sabe por la extensión, aunque el enlace venga firmado", () => {
    expect(esVideo("https://x.supabase.co/storage/v1/object/sign/content-proofs/reservations/1/a.mov?token=abc")).toBe(true);
    expect(esVideo("https://x/a.MP4")).toBe(true);
    expect(esVideo("https://x/a.jpg?token=mov")).toBe(false);
  });
});
