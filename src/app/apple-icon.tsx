import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 180, height: 180 };

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "#2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* c letter */}
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 122,
            fontWeight: 300,
            color: "#CBB78F",
            lineHeight: 1,
            marginTop: 20,
          }}
        >
          c
        </span>
        {/* horizontal line — positioned lower so it doesn't look like E */}
        <div
          style={{
            position: "absolute",
            left: 28,
            right: 28,
            top: 108,
            height: 6,
            background: "#CBB78F",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
