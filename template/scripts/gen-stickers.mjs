#!/usr/bin/env node
// Generate 4 sticker-style flat illustration PNGs via Gemini 3 Pro Image,
// then strip the white background and trim transparent margins.
//
// Usage:
//   node scripts/gen-stickers.mjs '[
//     {"slug":"a","subject":"a croissant on a white plate, top-down view"},
//     {"slug":"b","subject":"a sunny-side-up egg in a black pan, top-down"},
//     {"slug":"c","subject":"a bowl of oatmeal with berries, top-down"},
//     {"slug":"d","subject":"a sesame bagel split in half on a cutting board"}
//   ]'
//
// Writes to assets/sticker-<slug>.png. Requires GEMINI_API_KEY in env and
// `sharp` installed (npm install).

import { writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import sharp from "sharp";

const PROJECT = resolve(new URL("..", import.meta.url).pathname);
const ASSETS = join(PROJECT, "assets");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY missing — export it before running");
  process.exit(1);
}

const raw = process.argv[2];
if (!raw) {
  console.error("usage: gen-stickers.mjs '<json array of {slug, subject}>'");
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(raw);
} catch (e) {
  console.error(`invalid JSON: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(spec) || spec.length === 0) {
  console.error("expected non-empty array of {slug, subject}");
  process.exit(1);
}

const MODEL = "gemini-3-pro-image-preview";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE =
  "Cute flat illustration of {SUBJECT}. Soft pastel colors, hand-drawn style, simple clean shapes, NO outline, NO border, NO sticker effect, NO shadow, NO text. Pure white background (#FFFFFF), isolated subject, lots of empty whitespace padding around the subject, centered composition.";

const WHITE_THRESHOLD = 235;
const PAD_RATIO = 0.05;

async function gen(prompt) {
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!part) throw new Error(`no inlineData: ${JSON.stringify(json).slice(0, 400)}`);
  return Buffer.from(part.inlineData.data, "base64");
}

async function postProcess(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    if (
      data[i] >= WHITE_THRESHOLD &&
      data[i + 1] >= WHITE_THRESHOLD &&
      data[i + 2] >= WHITE_THRESHOLD
    ) {
      data[i + 3] = 0;
    }
  }
  const stripped = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: ch },
  })
    .png()
    .toBuffer();

  const trimmed = await sharp(stripped)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const meta = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(meta.width, meta.height) * PAD_RATIO);
  const side = Math.max(meta.width, meta.height) + pad * 2;

  return sharp({
    create: { width: side, height: side, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      {
        input: trimmed,
        left: Math.round((side - meta.width) / 2),
        top: Math.round((side - meta.height) / 2),
      },
    ])
    .png()
    .toBuffer();
}

for (const item of spec) {
  const { slug, subject } = item;
  if (!slug || !subject) {
    console.error(`skipping bad entry: ${JSON.stringify(item)}`);
    continue;
  }
  const name = `sticker-${slug}.png`;
  process.stdout.write(`generating ${name} ... `);
  try {
    const raw = await gen(STYLE.replace("{SUBJECT}", subject));
    const processed = await postProcess(raw);
    const out = join(ASSETS, name);
    await writeFile(out, processed);
    console.log(`${processed.length} bytes`);
  } catch (e) {
    console.error(`FAILED: ${e.message}`);
    process.exitCode = 1;
  }
}
