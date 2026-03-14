import { ImageResponse } from "next/og";

export const alt = "Foci – Your Focus System: Timer, Tasks, Goals & Ambient Music";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1a36 0%, #0c0c18 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            marginBottom: 40,
            position: "relative",
          }}
        >
          {/* Ambient glow */}
          <div style={{ position: "absolute", width: 50, height: 50, borderRadius: "50%", background: "radial-gradient(circle, rgba(195,210,255,0.2) 0%, transparent 100%)" }} />
          {/* Outer ring */}
          <div style={{ position: "absolute", width: 84, height: 84, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.25)" }} />
          {/* Inner ring */}
          <div style={{ position: "absolute", width: 50, height: 50, borderRadius: "50%", border: "2.5px solid rgba(255,255,255,0.5)" }} />
          {/* Focal point */}
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "radial-gradient(circle at 40% 35%, #ffffff, #d0d8ff)" }} />
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 700,
            color: "white",
            letterSpacing: -3,
          }}
        >
          Foci
        </div>
        <div
          style={{
            fontSize: 26,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 16,
            letterSpacing: -0.5,
          }}
        >
          Your focus system, not just a timer.
        </div>
        <div
          style={{
            display: "flex",
            gap: 28,
            marginTop: 52,
            color: "rgba(255, 255, 255, 0.35)",
            fontSize: 17,
            letterSpacing: 0.5,
          }}
        >
          <span>Timer</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Tasks</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Goals</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Ambient Music</span>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <span>Free</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
