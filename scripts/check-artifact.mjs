import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { spawnSync } from "node:child_process";

const html = await readFile("apresentacao.html", "utf8");
const dom = new JSDOM(html);
const document = dom.window.document;
assert.equal(document.documentElement.lang, "pt-BR");
assert.equal(document.querySelectorAll("h1").length, 1);
assert.equal(document.querySelectorAll("main > section").length, 13);
for (const anchor of document.querySelectorAll('a[href^="#"]'))
  assert.ok(
    document.getElementById(anchor.getAttribute("href").slice(1)),
    `Âncora inválida: ${anchor.getAttribute("href")}`,
  );
assert.equal(
  document.querySelectorAll('script[src],link[rel="stylesheet"]').length,
  0,
);
assert.equal(document.querySelectorAll("style").length, 1);
assert.ok(!document.querySelector("style").textContent.includes("/assets/"));
assert.ok(!document.getElementById("root").textContent.includes("R$ 89"));
const portraits = [...document.querySelectorAll(".founder-photo")];
assert.equal(portraits.length, 2);
assert.ok(
  portraits.every((image) =>
    image.getAttribute("src").startsWith("data:image/png;base64,"),
  ),
);
assert.equal(document.querySelectorAll(".portrait-placeholder").length, 0);
const logos = [...document.querySelectorAll(".logo img")];
assert.equal(logos.length, 2);
assert.ok(
  logos.every((image) =>
    image.getAttribute("src").startsWith("data:image/svg+xml;base64,"),
  ),
);
assert.equal(document.querySelectorAll(".brand-symbol").length, 0);
await mkdir("qa", { recursive: true });
await writeFile(
  "qa/standalone-script.mjs",
  document.querySelector('script[type="module"]').textContent,
);
const result = spawnSync(
  process.execPath,
  ["--check", "qa/standalone-script.mjs"],
  { encoding: "utf8" },
);
assert.equal(result.status, 0, result.stderr);
dom.window.close();
console.log(
  "Apresentação verificada: HTML pt-BR, H1 único, 13 seções editoriais + header/footer, âncoras válidas, fontes incorporadas e JavaScript íntegro.",
);
