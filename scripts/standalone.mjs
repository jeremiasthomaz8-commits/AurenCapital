import { readFile, writeFile, readdir } from "node:fs/promises";

let html = await readFile("dist/index.html", "utf8");
const files = await readdir("dist/assets");
const cssFile = files.find((file) => /^index-.*\.css$/.test(file));
const jsFile = files.find((file) => /^index-.*\.js$/.test(file));
let css = await readFile(`dist/assets/${cssFile}`, "utf8");
for (const font of files.filter((file) => /\.woff2?$/.test(file))) {
  const encoded = (await readFile(`dist/assets/${font}`)).toString("base64");
  css = css.replaceAll(
    `/assets/${font}`,
    `data:font/${font.endsWith("woff2") ? "woff2" : "woff"};base64,${encoded}`,
  );
}
let js = await readFile(`dist/assets/${jsFile}`, "utf8");
for (const file of (await readdir("public")).filter((file) =>
  /\.(png|jpe?g|webp|svg)$/i.test(file),
)) {
  const mime = /\.svg$/i.test(file)
    ? "image/svg+xml"
    : /\.png$/i.test(file)
      ? "image/png"
      : /\.webp$/i.test(file)
        ? "image/webp"
        : "image/jpeg";
  const dataUrl = `data:${mime};base64,${(await readFile(`public/${file}`)).toString("base64")}`;
  // Embed the same asset in the initial HTML and the hydrated React configuration.
  html = html.replaceAll(`/${file}`, dataUrl);
  js = js.replaceAll(`/${file}`, dataUrl);
}
const favicon = (await readFile("public/favicon.svg")).toString("base64");
html = html.replace(
  /<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/,
  () =>
    `<script type="module">${js.replaceAll("</script", "<\\/script")}</script>`,
);
html = html.replace(
  /<link rel="stylesheet"[^>]*>/,
  () => `<style>${css}</style>`,
);
html = html.replace(
  'href="/favicon.svg"',
  `href="data:image/svg+xml;base64,${favicon}"`,
);
html = html.replace(/<meta property="og:image"[^>]*>/, "");
// This distributable always uses the presentation configuration and never contains credentials.
await writeFile("apresentacao.html", html);
console.log(
  "apresentacao.html: arquivo independente com fontes, estilos e interações incorporados.",
);
