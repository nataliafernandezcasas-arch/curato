import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f8f7f4",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Purple M + dot from the real Midi logo */}
        <svg width="220" height="130" viewBox="100 100 260 240" fill="none">
          <path d="M143.512 117.913H107.027V318.914H145.927C145.927 232.586 145.927 198.296 143.782 181.595L204.411 270.472L264.506 181.595C262.361 198.296 262.361 192.104 262.361 277.868H301.26V117.913H264.506L204.141 205.661L143.512 117.913Z" fill="#825DC7"/>
          <path d="M340.078 277.874H301.178V318.915H340.078V277.874Z" fill="#825DC7"/>
        </svg>

        {/* Midi Pass text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "20px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#a09a92", letterSpacing: "3px", textTransform: "uppercase" as const }}>
            PASS
          </span>
        </div>

        {/* Tagline */}
        <p style={{ fontSize: "22px", color: "#6b6660", marginTop: "20px", fontWeight: 300 }}>
          Experiencias reales. Contenido auténtico.
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
