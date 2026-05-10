import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 32, height: 32 };

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "#2a2a2a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: 22,
            fontWeight: 300,
            color: "#CBB78F",
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          c
        </span>
        <div
          style={{
            position: "absolute",
            left: 5,
            right: 5,
            top: 19,
            height: 1,
            background: "#CBB78F",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
