import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Curato · Paris · Sur invitation";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#1A1A1A",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle corner accents */}
        <div style={{ position: "absolute", top: 48, left: 48, width: 40, height: 1, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", top: 48, left: 48, width: 1, height: 40, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", top: 48, right: 48, width: 40, height: 1, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", top: 48, right: 48, width: 1, height: 40, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 48, left: 48, width: 40, height: 1, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 48, left: 48, width: 1, height: 40, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 48, right: 48, width: 40, height: 1, background: "#CBB78F", opacity: 0.4, display: "flex" }} />
        <div style={{ position: "absolute", bottom: 48, right: 48, width: 1, height: 40, background: "#CBB78F", opacity: 0.4, display: "flex" }} />

        {/* Logo circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#2a2a2a",
            border: "1px solid #CBB78F33",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 48,
          }}
        >
          <span style={{ fontFamily: "Georgia, serif", fontSize: 70, fontWeight: 300, color: "#CBB78F", lineHeight: 1, marginTop: 12 }}>c</span>
          <div style={{ position: "absolute", left: 22, right: 22, top: 68, height: 3, background: "#CBB78F", display: "flex" }} />
        </div>

        {/* Wordmark */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <span style={{ fontFamily: "Georgia, serif", fontSize: 20, letterSpacing: "0.5em", color: "#CBB78F", textTransform: "uppercase" }}>
            curato
          </span>
          <div style={{ width: 1, height: 32, background: "#CBB78F", opacity: 0.3, display: "flex" }} />
          <span style={{ fontFamily: "Georgia, serif", fontSize: 14, letterSpacing: "0.35em", color: "#CBB78F", opacity: 0.5, textTransform: "uppercase" }}>
            Paris · Sur invitation
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
