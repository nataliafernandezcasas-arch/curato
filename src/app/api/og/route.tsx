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
          alignItems: "flex-start",
          justifyContent: "flex-end",
          backgroundColor: "#1C1A18",
          padding: "80px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Decorative line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            backgroundColor: "#CBB78F",
            opacity: 0.3,
          }}
        />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 400,
              color: "#CBB78F",
              letterSpacing: "0.35em",
              textTransform: "lowercase" as const,
              lineHeight: 1,
            }}
          >
            curato
          </span>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "1px",
                backgroundColor: "#CBB78F",
                opacity: 0.4,
              }}
            />
            <span
              style={{
                fontSize: "13px",
                color: "#7A7168",
                letterSpacing: "0.4em",
                textTransform: "uppercase" as const,
              }}
            >
              Paris · Invitation only
            </span>
          </div>

          <p
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 400,
              color: "#F5F0E8",
              opacity: 0.5,
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            Jamais une campagne. Toujours une histoire.
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
