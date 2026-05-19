#!/usr/bin/env node
// Generate 4 sticker-style flat illustration PNGs via Gemini 3 Pro Image,
// then post-process via ImageMagick CLI: strip white bg → trim → center-pad
// to square with 5% margin. Single magick invocation per image.
//
// Usage:
//   node scripts/gen-stickers.mjs '[
//     {"slug":"a","subject":"a croissant on a white plate, top-down view"},
//     {"slug":"b","subject":"a sunny-side-up egg in a black pan, top-down"},
//     {"slug":"c","subject":"a bowl of oatmeal with berries, top-down"},
//     {"slug":"d","subject":"a sesame bagel split in half on a cutting board"}
//   ]'
//
// Requires: GEMINI_API_KEY in env, `magick` (ImageMagick 7) on PATH.
// No npm deps.

import { writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { spawn } from "node:child_process";

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
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const STYLE =
  "Cute flat illustration of {SUBJECT}. Soft pastel colors, hand-drawn style, simple clean shapes, NO outline, NO border, NO sticker effect, NO shadow, NO text. Pure white background (#FFFFFF), isolated subject, lots of empty whitespace padding around the subject, centered composition.";

async function gen(prompt) {
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  const res = await fetch(API_URL, {
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

// One-shot ImageMagick: strip near-white → trim → pad to square (max(w,h)*1.10).
function postProcess(input) {
  return new Promise((resolveP, rejectP) => {
    const args = [
      "-",
      "-fuzz",
      "8%",
      "-transparent",
      "white",
      "-trim",
      "+repage",
      "-set",
      "option:dim",
      "%[fx:int(max(w,h)*1.10)]",
      "-background",
      "none",
      "-gravity",
      "center",
      "-extent",
      "%[dim]x%[dim]",
      "png:-",
    ];
    const p = spawn("magick", args);
    const chunks = [];
    const errs = [];
    p.stdout.on("data", (c) => chunks.push(c));
    p.stderr.on("data", (c) => errs.push(c));
    p.on("error", (e) => rejectP(new Error(`spawn magick: ${e.message}. Install: brew install imagemagick`)));
    p.on("exit", (code) =>
      code === 0
        ? resolveP(Buffer.concat(chunks))
        : rejectP(new Error(`magick exit ${code}: ${Buffer.concat(errs).toString().slice(0, 400)}`)),
    );
    p.stdin.write(input);
    p.stdin.end();
  });
}

console.log(`generating ${spec.length} sticker(s) in parallel...`);
const t0 = Date.now();

await Promise.all(
  spec.map(async (item) => {
    const { slug, subject } = item;
    if (!slug || !subject) {
      console.error(`✗ skipping bad entry: ${JSON.stringify(item)}`);
      process.exitCode = 1;
      return;
    }
    const name = `sticker-${slug}.png`;
    const start = Date.now();
    try {
      const raw = await gen(STYLE.replace("{SUBJECT}", subject));
      const processed = await postProcess(raw);
      const out = join(ASSETS, name);
      await writeFile(out, processed);
      console.log(`✓ ${name} (${processed.length} bytes, ${((Date.now() - start) / 1000).toFixed(1)}s)`);
    } catch (e) {
      console.error(`✗ ${name} FAILED: ${e.message}`);
      process.exitCode = 1;
    }
  }),
);

console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
