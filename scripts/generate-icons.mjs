/**
 * Gera os icones do PWA a partir da marca (o mesmo traco de components/brand.tsx).
 *
 * Rode com `npm run icons` sempre que a identidade mudar. O sharp ja vem no
 * projeto (dependencia do Next) e rasteriza o SVG direto, sem ferramenta extra.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const WAVE_PATH =
  "M 0 100 C 26 100, 30 38, 58 38 C 86 38, 90 162, 120 162 C 150 162, 154 62, 182 62 C 210 62, 214 124, 242 124";
const WAVE_VIEWBOX = "-16 20 274 160";
const WAVE_RATIO = 274 / 160;

const BRAND = "#4F7CFF";
const PURPLE = "#7A5CFA";

/**
 * @param {object} options
 * @param {number} options.size lado do quadrado, em px
 * @param {number} options.coverage fracao do lado ocupada pela onda
 * @param {number | null} options.radius canto arredondado; null = sangria total
 */
function iconSvg({ size, coverage, radius }) {
  const waveWidth = size * coverage;
  const waveHeight = waveWidth / WAVE_RATIO;
  const x = (size - waveWidth) / 2;
  const y = (size - waveHeight) / 2;
  const shape =
    radius === null
      ? `<rect width="${size}" height="${size}" fill="url(#bg)" />`
      : `<rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#bg)" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${BRAND}" />
      <stop offset="100%" stop-color="${PURPLE}" />
    </linearGradient>
  </defs>
  ${shape}
  <svg x="${x}" y="${y}" width="${waveWidth}" height="${waveHeight}" viewBox="${WAVE_VIEWBOX}">
    <path d="${WAVE_PATH}" fill="none" stroke="#ffffff" stroke-width="28" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</svg>`;
}

/** Icones "any" tem canto arredondado proprio; maskable sangra e respeita a safe zone de 80%. */
const TARGETS = [
  { file: "public/icons/icon-192.png", size: 192, coverage: 0.68, radius: 42 },
  { file: "public/icons/icon-512.png", size: 512, coverage: 0.68, radius: 112 },
  { file: "public/icons/maskable-192.png", size: 192, coverage: 0.56, radius: null },
  { file: "public/icons/maskable-512.png", size: 512, coverage: 0.56, radius: null },
  // convencao de arquivo do Next: vira <link rel="apple-touch-icon"> sozinho.
  // O iOS aplica a propria mascara, entao o fundo sangra.
  { file: "app/apple-icon.png", size: 180, coverage: 0.62, radius: null },
];

await mkdir(path.join(ROOT, "public/icons"), { recursive: true });

for (const { file, ...options } of TARGETS) {
  const svg = iconSvg(options);
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(ROOT, file), png);
  console.log(`ok  ${file}  (${options.size}x${options.size}, ${png.length} bytes)`);
}
