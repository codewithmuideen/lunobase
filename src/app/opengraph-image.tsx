import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Lunobase - Buy, sell and trade crypto securely";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/brand/logo-white.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(80% 90% at 85% 10%, #0052FF 0%, #0B2A8F 35%, #0B0F19 75%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} alt="" width={330} height={125} style={{ marginLeft: -12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            The secure way to buy, sell and grow crypto.
          </div>
          <div style={{ fontSize: 28, color: "#CED0D4" }}>Live markets · Bank-grade security · 24/7 support</div>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 22, color: "#EDF2FF" }}>
          {["BTC", "ETH", "SOL", "USDT", "XRP"].map((s) => (
            <div key={s} style={{ padding: "10px 18px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.25)" }}>
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
