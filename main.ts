// news-image-20261119 — "The World in One Day"
// Draws a 1024x1024 newspaper front page summing up Thursday 19 November
// 2026 in code: a hand-written PNG encoder plus a 5x7 bitmap font, Node 22
// standard library only. No network, no Date.now(), no randomness: two runs
// write byte-identical output.
//
// Run: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// The grader runs it with /output as the output directory.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

// ---------------------------------------------------------------- font ----
// 5x7 bitmap font, uppercase + digits + punctuation. Each glyph is 7 rows
// of 5 bits ("1" = ink). Unknown characters render as a blank.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "00100", "01000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "·": ["00000", "00000", "00000", "01100", "01100", "00000", "00000"],
  "—": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
};

// ------------------------------------------------------------- canvas ----
type RGB = [number, number, number];

const W = 1024;
const H = 1024;

const PAPER: RGB = [246, 241, 231];
const INK: RGB = [26, 26, 26];
const NAVY: RGB = [20, 33, 61];
const GOLD: RGB = [201, 162, 39];
const RED: RGB = [164, 28, 28];
const MUTED: RGB = [90, 90, 90];
const SUMMARY: RGB = [58, 58, 58]; // darker than MUTED: body copy must stay legible at 300 px
const WHITE: RGB = [255, 255, 255];
const CARD: RGB = [255, 255, 255];
const LINE: RGB = [210, 203, 188];

class Canvas {
  buf: Buffer;
  constructor() {
    this.buf = Buffer.alloc(W * H * 3);
    this.fill(PAPER);
  }
  fill(c: RGB): void {
    for (let i = 0; i < W * H; i++) {
      this.buf[i * 3] = c[0];
      this.buf[i * 3 + 1] = c[1];
      this.buf[i * 3 + 2] = c[2];
    }
  }
  px(x: number, y: number, c: RGB): void {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const i = (y * W + x) * 3;
    this.buf[i] = c[0];
    this.buf[i + 1] = c[1];
    this.buf[i + 2] = c[2];
  }
  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) this.px(i, j, c);
    }
  }
  hline(x: number, y: number, w: number, c: RGB, t = 1): void {
    this.rect(x, y, w, t, c);
  }
  vline(x: number, y: number, h: number, c: RGB, t = 1): void {
    this.rect(x, y, t, h, c);
  }
  // Bresenham line.
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    for (;;) {
      this.rect(x - ((t - 1) >> 1), y - ((t - 1) >> 1), t, t, c);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y += sy;
      }
    }
  }
  circle(cx: number, cy: number, r: number, c: RGB, t = 1): void {
    // Midpoint circle outline.
    let x = r;
    let y = 0;
    let err = 0;
    while (x >= y) {
      for (const [px, py] of [
        [cx + x, cy + y], [cx + y, cy + x], [cx - y, cy + x], [cx - x, cy + y],
        [cx - x, cy - y], [cx - y, cy - x], [cx + y, cy - x], [cx + x, cy - y],
      ] as const) {
        this.rect(px - ((t - 1) >> 1), py - ((t - 1) >> 1), t, t, c);
      }
      y += 1;
      err += 1 + 2 * y;
      if (2 * (err - x) + 1 > 0) {
        x -= 1;
        err += 1 - 2 * x;
      }
    }
  }
  disc(cx: number, cy: number, r: number, c: RGB): void {
    for (let y = -r; y <= r; y++) {
      const half = Math.floor(Math.sqrt(r * r - y * y));
      for (let x = -half; x <= half; x++) this.px(cx + x, cy + y, c);
    }
  }
  // Filled triangle (scanline).
  tri(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
    const minY = Math.min(y0, y1, y2);
    const maxY = Math.max(y0, y1, y2);
    for (let y = minY; y <= maxY; y++) {
      const xs: number[] = [];
      for (const [ax, ay, bx, by] of [
        [x0, y0, x1, y1], [x1, y1, x2, y2], [x2, y2, x0, y0],
      ] as const) {
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          xs.push(Math.round(ax + ((y - ay) / (by - ay)) * (bx - ax)));
        }
      }
      if (xs.length >= 2) {
        const lo = Math.min(...xs);
        const hi = Math.max(...xs);
        for (let x = lo; x <= hi; x++) this.px(x, y, c);
      }
    }
  }
  // --- text ---
  textWidth(s: string, scale: number): number {
    return s.length * 6 * scale;
  }
  text(x: number, y: number, s: string, scale: number, c: RGB): void {
    let cx = x;
    // The font holds uppercase glyphs only; fold the input to uppercase.
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch] ?? FONT[" "];
      for (let r = 0; r < 7; r++) {
        for (let col = 0; col < 5; col++) {
          if (g[r][col] === "1") {
            this.rect(cx + col * scale, y + r * scale, scale, scale, c);
          }
        }
      }
      cx += 6 * scale;
    }
  }
  textCentered(cx: number, y: number, s: string, scale: number, c: RGB): void {
    this.text(cx - Math.floor(this.textWidth(s, scale) / 2), y, s, scale, c);
  }
  // Greedy word wrap into lines of at most maxWidth px.
  wrap(s: string, maxWidth: number, scale: number): string[] {
    const words = s.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const trial = cur ? cur + " " + w : w;
      if (this.textWidth(trial, scale) <= maxWidth || !cur) {
        cur = trial;
      } else {
        lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}

// -------------------------------------------------------------- PNG ------
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePNG(cv: Canvas): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type 2 = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    cv.buf.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ layout ----
// Newspaper front page, 1024x1024.
//
//   masthead 0..104      THE WORLD IN ONE DAY / THURSDAY · 19 NOVEMBER 2026
//   lead     120..372    Trump, Xi and Putin meet in Shenzhen
//   cards    388..916    2 cols x 3 rows, 480x168 each, gap 12
//   also     928..968    ALSO TODAY strip (two lines)
//   footer   978..1000   ONE DAY · ONE IMAGE · 19 NOVEMBER 2026

interface Story {
  kicker: string;
  color: RGB;
  headline: string[]; // pre-wrapped lines, <= 18 chars each at scale 4
  summary: string[]; // two pre-wrapped lines, <= 25 chars each
}

const BLUE: RGB = [29, 78, 137];
const GREEN: RGB = [46, 125, 50];
const CRIMSON: RGB = [166, 28, 28];
const PURPLE: RGB = [91, 44, 134];
const TEAL: RGB = [14, 124, 123];
const ORANGE: RGB = [194, 87, 27];

const STORIES: Story[] = [
  {
    kicker: "UKRAINE",
    color: BLUE,
    headline: ["CRIMEA BRIDGE HIT", "AGAIN"],
    summary: ["Third strike this week;", "traffic halted overnight."],
  },
  {
    kicker: "JUSTICE",
    color: PURPLE,
    headline: ["WORLD COURT RULES", "ON ROHINGYA CASE"],
    summary: ["Seven-year case ends", "in The Hague today."],
  },
  {
    kicker: "TECH",
    color: CRIMSON,
    headline: ["ANTHROPIC DEBUTS", "ON NASDAQ"],
    summary: ["$81.3bn IPO, biggest", "ever; shares trade today."],
  },
  {
    kicker: "SPACE",
    color: TEAL,
    headline: ["VOYAGER 1 ONE", "LIGHT-DAY OUT"],
    summary: ["NASA marks the milestone", "live today, 16bn miles."],
  },
  {
    kicker: "GAMING",
    color: GREEN,
    headline: ["GTA VI ROLLS OUT", "WORLDWIDE"],
    summary: ["After 13 years, Vice City", "returns; reviews hit 99."],
  },
  {
    kicker: "ASIA",
    color: ORANGE,
    headline: ["INDIA, JAPAN HOLD", "2+2 TALKS"],
    summary: ["Defence ministers meet in", "Tokyo; Indo-Pacific ties."],
  },
];

// Globe pictogram for the lead story: circle, meridians, two gold dots.
function drawGlobe(cv: Canvas, cx: number, cy: number, r: number): void {
  cv.circle(cx, cy, r, NAVY, 4);
  // Latitude chords.
  for (const dy of [-Math.floor(r * 0.55), 0, Math.floor(r * 0.55)]) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy));
    cv.hline(cx - half, cy + dy, half * 2, NAVY, 2);
  }
  // Longitude chords.
  for (const dx of [-Math.floor(r * 0.55), Math.floor(r * 0.55)]) {
    const half = Math.floor(Math.sqrt(r * r - dx * dx));
    cv.vline(cx + dx, cy - half, half * 2, NAVY, 2);
  }
  // Shenzhen (east) and The Hague (west) markers.
  cv.disc(cx + Math.floor(r * 0.45), cy - Math.floor(r * 0.25), 5, GOLD);
  cv.disc(cx - Math.floor(r * 0.55), cy - Math.floor(r * 0.3), 5, RED);
}

function drawPage(cv: Canvas): void {
  // ---- masthead ----
  cv.rect(0, 0, W, 104, NAVY);
  cv.textCentered(W / 2, 16, "THE WORLD IN ONE DAY", 5, WHITE);
  cv.textCentered(W / 2, 64, "THURSDAY · 19 NOVEMBER 2026", 3, GOLD);
  cv.hline(0, 100, W, GOLD, 4);

  // ---- lead story ----
  cv.rect(24, 120, 976, 252, CARD);
  cv.hline(24, 120, 976, NAVY, 3);
  cv.hline(24, 369, 976, NAVY, 3);
  drawGlobe(cv, 168, 244, 76);
  cv.textCentered(168, 336, "SHENZHEN · THE HAGUE", 2, SUMMARY);
  const lx = 300;
  cv.text(lx, 140, "ASIA · SUMMITS", 2, RED);
  cv.text(lx, 164, "TRUMP, XI AND PUTIN MEET", 4, INK);
  cv.text(lx, 198, "FIRST TRILATERAL SUMMIT", 4, INK);
  cv.hline(lx, 236, 660, GOLD, 3);
  const lead = [
    "Three nuclear powers meet in",
    "Shenzhen at the APEC summit,",
    "talks on arms control, trade",
    "and the wars in Ukraine, Iran.",
  ];
  lead.forEach((ln, i) => cv.text(lx, 252 + i * 24, ln, 3, INK));

  // ---- story cards ----
  STORIES.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 24 + col * (480 + 16);
    const y = 388 + row * (168 + 12);
    cv.rect(x, y, 480, 168, CARD);
    cv.rect(x, y, 10, 168, s.color);
    cv.rect(x + 24, y + 15, 10, 10, s.color);
    cv.text(x + 42, y + 14, s.kicker, 2, s.color);
    s.headline.forEach((ln, j) => cv.text(x + 24, y + 40 + j * 30, ln, 4, INK));
    s.summary.forEach((ln, j) => cv.text(x + 24, y + 108 + j * 22, ln, 3, SUMMARY));
    cv.hline(x + 24, y + 152, 480 - 48, LINE, 1);
  });

  // ---- also today ----
  cv.rect(24, 928, 976, 40, NAVY);
  cv.textCentered(W / 2, 932, "ALSO TODAY: CYCLONE AKVAN NEARS INDIA, 50,000 EVACUATED", 2, WHITE);
  cv.textCentered(W / 2, 950, "PEW: ISLAM LARGEST FAITH BY 2035 · FOUR NATIONS URGE GAZA AID ACCESS", 2, WHITE);

  // ---- footer ----
  cv.textCentered(W / 2, 984, "ONE DAY · ONE IMAGE · 19 NOVEMBER 2026", 2, SUMMARY);
  cv.hline(24, 1006, 976, GOLD, 2);
}

// -------------------------------------------------------------- main -----
function main(): void {
  const cv = new Canvas();
  drawPage(cv);
  const png = encodePNG(cv);
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), png);
}

main();
