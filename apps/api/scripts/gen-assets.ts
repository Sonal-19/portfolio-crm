// Generates the Shimla Wale brand SVGs (logo, placeholders, release posters,
// kirtan gallery, blog covers, social thumbnails) into apps/api/uploads/ and the favicon into
// apps/web/public/. Run with `bun run assets` from apps/api.
import { mkdir } from "node:fs/promises";

const NAVY = "#0f1b3d";
const NAVY_2 = "#1a2a5a";
const SAFFRON = "#f08a24";
const GOLD = "#d4a64a";
const GOLD_LIGHT = "#f3d58a";
const CREAM = "#fbf7ef";

const UP = new URL("../uploads/", import.meta.url).pathname;
const WEB_PUBLIC = new URL("../../web/public/", import.meta.url).pathname;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function wrap(text: string, max: number) {
  const out: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    if (`${line} ${w}`.trim().length > max && line) {
      out.push(line);
      line = w;
    } else line = `${line} ${w}`.trim();
  }
  if (line) out.push(line);
  return out;
}

async function write(path: string, svg: string) {
  await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  await Bun.write(path, svg.trim());
  console.info(
    "  ✓",
    path.replace(`${UP}`, "uploads/").replace(WEB_PUBLIC, "web/public/"),
  );
}

// ── Emblem: microphone inside a gold ring with sound waves ──
function emblem(id: string, size = 96) {
  const s = size / 96;
  return `
  <g transform="scale(${s})">
    <defs>
      <linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${GOLD_LIGHT}"/>
        <stop offset="0.55" stop-color="${GOLD}"/>
        <stop offset="1" stop-color="${SAFFRON}"/>
      </linearGradient>
      <radialGradient id="${id}-bg" cx="0.5" cy="0.35" r="0.7">
        <stop offset="0" stop-color="${NAVY_2}"/>
        <stop offset="1" stop-color="${NAVY}"/>
      </radialGradient>
    </defs>
    <circle cx="48" cy="48" r="46" fill="url(#${id}-bg)"/>
    <circle cx="48" cy="48" r="44" fill="none" stroke="url(#${id}-g)" stroke-width="2.5"/>
    <circle cx="48" cy="48" r="39" fill="none" stroke="${GOLD}" stroke-opacity="0.35" stroke-width="0.8" stroke-dasharray="1.5 3"/>
    <!-- sound waves -->
    <g fill="none" stroke="url(#${id}-g)" stroke-linecap="round">
      <path d="M26 36 Q20 46 26 56" stroke-width="3"/>
      <path d="M19 31 Q10 46 19 61" stroke-width="2.2" stroke-opacity="0.7"/>
      <path d="M70 36 Q76 46 70 56" stroke-width="3"/>
      <path d="M77 31 Q86 46 77 61" stroke-width="2.2" stroke-opacity="0.7"/>
    </g>
    <!-- microphone -->
    <rect x="39" y="20" width="18" height="32" rx="9" fill="url(#${id}-g)"/>
    <g stroke="${NAVY}" stroke-opacity="0.45" stroke-width="1.2">
      <line x1="41" y1="29" x2="55" y2="29"/><line x1="41" y1="34" x2="55" y2="34"/><line x1="41" y1="39" x2="55" y2="39"/>
    </g>
    <path d="M33 44 Q33 60 48 60 Q63 60 63 44" fill="none" stroke="url(#${id}-g)" stroke-width="3" stroke-linecap="round"/>
    <line x1="48" y1="60" x2="48" y2="70" stroke="url(#${id}-g)" stroke-width="3" stroke-linecap="round"/>
    <path d="M38 72 H58" stroke="url(#${id}-g)" stroke-width="3.2" stroke-linecap="round"/>
  </g>`;
}

function logo(textColor: string, subColor: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" role="img" aria-label="Shimla Wale logo">
  ${emblem("lg")}
  <text x="110" y="50" font-family="'Cinzel','Playfair Display',Georgia,serif" font-size="34" font-weight="700" textLength="240" lengthAdjust="spacingAndGlyphs" fill="${textColor}">SHIMLA WALE</text>
  <line x1="111" y1="62" x2="351" y2="62" stroke="${GOLD}" stroke-width="1.2" stroke-opacity="0.8"/>
  <text x="111" y="80" font-family="'Mukta','Segoe UI',Arial,sans-serif" font-size="13.5" textLength="240" lengthAdjust="spacing" fill="${subColor}">BHAI GURPREET SINGH JI</text>
</svg>`;
}

const markSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="Shimla Wale">${emblem("mk")}</svg>`;

// ── Hero pattern: gold rays + mandala ──
function mandala(cx: number, cy: number, r: number, opacity: number) {
  const petals = Array.from({ length: 24 }, (_, i) => {
    const a = (i * 360) / 24;
    return `<ellipse cx="${cx}" cy="${cy - r * 0.62}" rx="${r * 0.09}" ry="${r * 0.3}" transform="rotate(${a} ${cx} ${cy})"/>`;
  }).join("");
  const dots = Array.from({ length: 48 }, (_, i) => {
    const a = (i * Math.PI * 2) / 48;
    return `<circle cx="${(cx + Math.cos(a) * r * 0.98).toFixed(1)}" cy="${(cy + Math.sin(a) * r * 0.98).toFixed(1)}" r="${r * 0.012}"/>`;
  }).join("");
  return `<g fill="none" stroke="${GOLD}" stroke-opacity="${opacity}" stroke-width="1.2">
    <circle cx="${cx}" cy="${cy}" r="${r}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.9}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.3}"/><circle cx="${cx}" cy="${cy}" r="${r * 0.22}"/>
    ${petals}
  </g><g fill="${GOLD}" fill-opacity="${opacity * 1.4}">${dots}</g>`;
}

const heroBg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="glow" cx="0.72" cy="0.38" r="0.6">
      <stop offset="0" stop-color="${SAFFRON}" stop-opacity="0.35"/>
      <stop offset="0.45" stop-color="${NAVY_2}" stop-opacity="0.6"/>
      <stop offset="1" stop-color="${NAVY}"/>
    </radialGradient>
  </defs>
  <rect width="1600" height="900" fill="${NAVY}"/>
  <rect width="1600" height="900" fill="url(#glow)"/>
  <g stroke="${GOLD_LIGHT}" stroke-opacity="0.06" stroke-width="40">
    ${Array.from({ length: 14 }, (_, i) => `<line x1="1150" y1="340" x2="${1150 + Math.cos((i * Math.PI) / 7) * 1400}" y2="${340 + Math.sin((i * Math.PI) / 7) * 1400}"/>`).join("")}
  </g>
  ${mandala(1150, 340, 330, 0.18)}
  ${mandala(120, 820, 220, 0.1)}
</svg>`;

// ── Portrait placeholder: stylised dastar + beard silhouette ──
function portrait(bgA: string, bgB: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" role="img" aria-label="Portrait placeholder">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/></linearGradient>
    <linearGradient id="dastar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e9e3d6"/></linearGradient>
    <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c98b62"/><stop offset="1" stop-color="#a86e4b"/></linearGradient>
    <linearGradient id="beard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2521"/><stop offset="1" stop-color="#15110f"/></linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.32" r="0.5"><stop offset="0" stop-color="${GOLD_LIGHT}" stop-opacity="0.55"/><stop offset="1" stop-color="${GOLD}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="600" height="750" fill="url(#bg)"/>
  <circle cx="300" cy="250" r="260" fill="url(#halo)"/>
  ${mandala(300, 250, 230, 0.16)}
  <!-- shoulders / chola -->
  <path d="M60 750 C80 560 190 505 300 505 C410 505 520 560 540 750 Z" fill="#f7f3ea"/>
  <path d="M300 505 L260 750 M300 505 L340 750" stroke="#ddd4c2" stroke-width="3"/>
  <path d="M60 750 C75 640 120 590 175 560 L205 750 Z" fill="${NAVY_2}" opacity="0.85"/>
  <path d="M540 750 C525 640 480 590 425 560 L395 750 Z" fill="${NAVY_2}" opacity="0.85"/>
  <!-- neck + face -->
  <rect x="262" y="360" width="76" height="90" rx="30" fill="url(#skin)"/>
  <ellipse cx="300" cy="300" rx="92" ry="112" fill="url(#skin)"/>
  <!-- beard -->
  <path d="M208 300 C206 380 222 470 300 560 C378 470 394 380 392 300 C380 350 350 372 300 372 C250 372 220 350 208 300 Z" fill="url(#beard)"/>
  <path d="M258 350 C275 338 325 338 342 350 C330 356 270 356 258 350 Z" fill="#1d1916"/>
  <!-- eyes & brows (closed, in simran) -->
  <path d="M250 282 Q268 292 284 282" stroke="#3a2a20" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M316 282 Q332 292 350 282" stroke="#3a2a20" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M244 262 Q266 250 288 260" stroke="#221a15" stroke-width="6" fill="none" stroke-linecap="round"/>
  <path d="M312 260 Q334 250 356 262" stroke="#221a15" stroke-width="6" fill="none" stroke-linecap="round"/>
  <!-- dastar -->
  <path d="M196 250 C186 150 236 92 300 88 C364 92 414 150 404 250 C380 222 340 210 300 212 C260 210 220 222 196 250 Z" fill="url(#dastar)"/>
  <g stroke="#d8cfbd" stroke-width="3" fill="none" opacity="0.9">
    <path d="M210 214 C240 150 300 130 380 170"/>
    <path d="M204 236 C236 176 300 150 394 198"/>
    <path d="M222 184 C250 132 300 118 360 138"/>
    <path d="M300 212 L300 96" stroke-opacity="0.5"/>
  </g>
  <circle cx="300" cy="150" r="9" fill="${GOLD}" opacity="0.9"/>
</svg>`;
}

// ── Cards (blog covers + social thumbs) ──
function card(opts: {
  w: number;
  h: number;
  title: string;
  kicker: string;
  hue: [string, string];
  motif: "mic" | "harmonium" | "wave" | "lamp" | "tabla" | "book";
  badge?: string;
}) {
  const { w, h, title, kicker, hue, motif } = opts;
  const lines = wrap(title, w > 900 ? 26 : 22).slice(0, 3);
  const fs = w > 900 ? 58 : 46;
  const cx = w * 0.78;
  const cy = h * 0.42;
  const motifs: Record<typeof motif, string> = {
    mic: `<rect x="${cx - 40}" y="${cy - 90}" width="80" height="140" rx="40" fill="url(#g)"/><path d="M${cx - 70} ${cy + 10} Q${cx - 70} ${cy + 90} ${cx} ${cy + 90} Q${cx + 70} ${cy + 90} ${cx + 70} ${cy + 10}" fill="none" stroke="url(#g)" stroke-width="10"/>`,
    harmonium: `<rect x="${cx - 120}" y="${cy - 30}" width="240" height="110" rx="10" fill="url(#g)"/>${Array.from({ length: 12 }, (_, i) => `<rect x="${cx - 112 + i * 19}" y="${cy + 30}" width="15" height="42" fill="${CREAM}"/>`).join("")}<g stroke="${NAVY}" stroke-opacity="0.4" stroke-width="4">${Array.from({ length: 5 }, (_, i) => `<line x1="${cx - 110}" y1="${cy - 20 + i * 10}" x2="${cx + 110}" y2="${cy - 20 + i * 10}"/>`).join("")}</g>`,
    wave: `<g fill="none" stroke="url(#g)" stroke-width="8" stroke-linecap="round">${Array.from({ length: 4 }, (_, i) => `<path d="M${cx - 160} ${cy + i * 28 - 40} Q${cx - 80} ${cy - 80 + i * 28} ${cx} ${cy + i * 28 - 40} T${cx + 160} ${cy + i * 28 - 40}" stroke-opacity="${1 - i * 0.2}"/>`).join("")}</g>`,
    lamp: `<path d="M${cx - 90} ${cy + 40} Q${cx} ${cy + 110} ${cx + 90} ${cy + 40} Z" fill="url(#g)"/><path d="M${cx} ${cy - 90} C${cx + 35} ${cy - 40} ${cx + 25} ${cy + 10} ${cx} ${cy + 25} C${cx - 25} ${cy + 10} ${cx - 35} ${cy - 40} ${cx} ${cy - 90} Z" fill="${SAFFRON}"/><circle cx="${cx}" cy="${cy - 10}" r="120" fill="${GOLD_LIGHT}" opacity="0.12"/>`,
    tabla: `<ellipse cx="${cx - 60}" cy="${cy - 20}" rx="60" ry="20" fill="${CREAM}"/><path d="M${cx - 120} ${cy - 20} L${cx - 110} ${cy + 80} Q${cx - 60} ${cy + 100} ${cx - 10} ${cy + 80} L${cx} ${cy - 20}" fill="url(#g)"/><ellipse cx="${cx + 70}" cy="${cy}" rx="70" ry="24" fill="${CREAM}"/><path d="M${cx} ${cy} Q${cx - 10} ${cy + 110} ${cx + 70} ${cy + 110} Q${cx + 150} ${cy + 110} ${cx + 140} ${cy}" fill="url(#g)"/>`,
    book: `<path d="M${cx - 140} ${cy - 60} Q${cx - 70} ${cy - 90} ${cx} ${cy - 60} Q${cx + 70} ${cy - 90} ${cx + 140} ${cy - 60} L${cx + 140} ${cy + 80} Q${cx + 70} ${cy + 50} ${cx} ${cy + 80} Q${cx - 70} ${cy + 50} ${cx - 140} ${cy + 80} Z" fill="${CREAM}"/><line x1="${cx}" y1="${cy - 60}" x2="${cx}" y2="${cy + 80}" stroke="${GOLD}" stroke-width="4"/><path d="M${cx - 140} ${cy + 80} Q${cx - 70} ${cy + 50} ${cx} ${cy + 80} Q${cx + 70} ${cy + 50} ${cx + 140} ${cy + 80}" fill="none" stroke="url(#g)" stroke-width="8"/>`,
  };
  const badge = opts.badge
    ? `<rect x="${w - 190}" y="${h - 80}" width="150" height="46" rx="23" fill="#000" fill-opacity="0.45"/><text x="${w - 115}" y="${h - 49}" text-anchor="middle" font-family="Arial" font-weight="700" font-size="22" fill="${CREAM}">${esc(opts.badge)}</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hue[0]}"/><stop offset="1" stop-color="${hue[1]}"/></linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${GOLD_LIGHT}"/><stop offset="1" stop-color="${SAFFRON}"/></linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${mandala(cx, cy, Math.min(w, h) * 0.42, 0.14)}
  ${motifs[motif]}
  <text x="60" y="${h * 0.2}" font-family="'Mukta',Arial,sans-serif" font-size="${fs * 0.42}" letter-spacing="4" fill="${GOLD_LIGHT}">${esc(kicker.toUpperCase())}</text>
  ${lines.map((l, i) => `<text x="60" y="${h * 0.2 + 70 + i * fs * 1.15}" font-family="'Playfair Display',Georgia,serif" font-weight="700" font-size="${fs}" fill="${CREAM}">${esc(l)}</text>`).join("")}
  <rect x="60" y="${h - 60}" width="90" height="5" rx="2" fill="url(#g)"/>
  ${badge}
</svg>`;
}

const HUES: [string, string][] = [
  [NAVY, NAVY_2],
  ["#3b1f0e", "#8a4513"],
  ["#1f2d1a", "#3f5a2c"],
  ["#2a1033", "#5b2a6b"],
  ["#0c2d3a", "#1d5a6e"],
  ["#3a0f18", "#7a1f2b"],
];
const MOTIFS = ["lamp", "mic", "wave", "book", "harmonium", "tabla"] as const;

async function main() {
  console.info("Generating brand assets…");
  await write(`${UP}brand/logo.svg`, logo(CREAM, GOLD_LIGHT));
  await write(`${UP}brand/logo-dark.svg`, logo(NAVY, "#8a6a2a"));
  await write(`${UP}brand/logo-mark.svg`, markSvg);
  await write(`${WEB_PUBLIC}logo.svg`, logo(CREAM, GOLD_LIGHT));
  await write(`${WEB_PUBLIC}logo-dark.svg`, logo(NAVY, "#8a6a2a"));
  await write(`${WEB_PUBLIC}favicon.svg`, markSvg);
  await write(`${WEB_PUBLIC}hero-bg.svg`, heroBg);
  await write(`${UP}brand/hero-bg.svg`, heroBg);
  await write(`${UP}brand/portrait-placeholder.svg`, portrait(NAVY_2, NAVY));
  await write(
    `${UP}brand/about-placeholder.svg`,
    portrait("#3b1f0e", "#1c0e06"),
  );
  await write(
    `${WEB_PUBLIC}og-image.svg`,
    card({
      w: 1200,
      h: 630,
      title: "Bhai Gurpreet Singh Ji Shimla Wale",
      kicker: "Gurbani Kirtan · Amritvela Trust",
      hue: [NAVY, NAVY_2],
      motif: "mic",
    }),
  );

  const { releaseSeed } = await import("../src/db/seed/release-data");
  for (const [i, r] of releaseSeed.entries()) {
    const wide = r.aspect === "wide";
    await write(
      `${UP}${r.posterPath.replace("/uploads/", "")}`,
      card({
        w: wide ? 1280 : 1000,
        h: wide ? 720 : 1000,
        title: r.title,
        kicker: r.subtitle ?? "New release",
        hue: HUES[(i + 1) % HUES.length] as [string, string],
        motif: MOTIFS[i % MOTIFS.length] ?? "lamp",
        badge: wide ? "▶ WATCH" : "♫ LISTEN",
      }),
    );
  }

  const { siteSettingsSeed } = await import("../src/db/seed/site-data");
  for (const [i, g] of (siteSettingsSeed.gallery ?? []).entries()) {
    await write(
      `${UP}${g.imagePath.replace("/uploads/", "")}`,
      card({
        w: 1200,
        h: 800,
        title: g.title,
        kicker: "Kirtan moments",
        hue: HUES[(i + 3) % HUES.length] as [string, string],
        motif: MOTIFS[(i + 3) % MOTIFS.length] ?? "harmonium",
      }),
    );
  }

  const { blogSeed } = await import("../src/db/seed/blog-data");
  for (const [i, b] of blogSeed.entries()) {
    await write(
      `${UP}blog/cover-${i + 1}.svg`,
      card({
        w: 1200,
        h: 675,
        title: b.title,
        kicker: b.tags[0] ?? "blog",
        hue: HUES[i % HUES.length] as [string, string],
        motif: MOTIFS[i % MOTIFS.length] ?? "mic",
      }),
    );
  }

  const { socialSeedData } = await import("../src/db/seed/social-data");
  const counters = { youtube: 0, facebook: 0, instagram: 0 };
  for (const p of socialSeedData) {
    counters[p.platform] += 1;
    const n = counters[p.platform];
    const prefix =
      p.platform === "youtube" ? "yt" : p.platform === "facebook" ? "fb" : "ig";
    const square = p.platform === "instagram";
    await write(
      `${UP}social/${prefix}-${n}.svg`,
      card({
        w: square ? 800 : 1280,
        h: square ? 800 : 720,
        title:
          p.platform === "youtube"
            ? p.caption.replace(/^.*?[–-]\s*/, "")
            : (p.caption.split(/[.!🙏—]/u)[0]?.slice(0, 60) ?? ""),
        kicker: p.platform === "youtube" ? "Shimla Wale · Kirtan" : p.platform,
        hue: HUES[(n + (square ? 2 : 0)) % HUES.length] as [string, string],
        motif: MOTIFS[(n + 1) % MOTIFS.length] ?? "mic",
        badge: p.platform === "youtube" ? "▶ Watch" : undefined,
      }),
    );
  }
  console.info("Done.");
}

await main();
