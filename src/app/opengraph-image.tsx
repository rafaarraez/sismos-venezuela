import { ImageResponse } from "next/og";
import { MAGNITUDE_SCALE } from "@/lib/constants";

export const alt = "Sismos Venezuela — Monitor sísmico en tiempo real";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 90,
          background: "#07090f",
          backgroundImage:
            "radial-gradient(700px 400px at 10% -10%, rgba(56,189,248,0.18), transparent 60%), radial-gradient(700px 420px at 95% 0%, rgba(245,158,11,0.16), transparent 55%)",
          color: "#eef2ff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Onda sísmica estilizada */}
          <svg width="72" height="72" viewBox="0 0 24 24">
            <rect
              width="24"
              height="24"
              rx="6"
              fill="rgba(245,158,11,0.15)"
              stroke="rgba(245,158,11,0.5)"
              strokeWidth="0.6"
            />
            <polyline
              points="3,12 7,12 9,6 12,18 14,9 16,14 17,12 21,12"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 999,
              border: "1px solid rgba(52,211,153,0.4)",
              background: "rgba(16,185,129,0.12)",
              color: "#34d399",
              padding: "8px 20px",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "#34d399",
              }}
            />
            EN VIVO
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 84,
            fontWeight: 800,
            letterSpacing: -2,
          }}
        >
          Sismos Venezuela
        </div>
        <div style={{ marginTop: 14, fontSize: 34, color: "#93a0bd" }}>
          Monitor sísmico en tiempo real · mapa, réplicas y estadísticas
        </div>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 14 }}>
            {["FUNVISIS", "USGS", "EMSC", "SGC"].map((s) => (
              <div
                key={s}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.25)",
                  background: "rgba(20,26,42,0.6)",
                  color: "#93a0bd",
                  padding: "10px 22px",
                  fontSize: 24,
                }}
              >
                {s}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {MAGNITUDE_SCALE.map((m) => (
              <div
                key={m.label}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: m.color,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
