import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a1a36 0%, #0c0c18 100%)",
          borderRadius: 40,
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: 80,
            height: 80,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(195,210,255,0.15) 0%, transparent 100%)",
          }}
        />
        {/* Outer ring */}
        <div
          style={{
            position: "absolute",
            width: 142,
            height: 142,
            borderRadius: "50%",
            border: "5px solid rgba(255, 255, 255, 0.25)",
          }}
        />
        {/* Inner ring */}
        <div
          style={{
            position: "absolute",
            width: 86,
            height: 86,
            borderRadius: "50%",
            border: "4px solid rgba(255, 255, 255, 0.5)",
          }}
        />
        {/* Focal point */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 40% 35%, #ffffff, #d0d8ff)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
