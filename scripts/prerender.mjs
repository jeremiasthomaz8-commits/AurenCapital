import { createServer } from "vite";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { readFile, writeFile } from "node:fs/promises";

const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const { default: App } = await vite.ssrLoadModule("/src/App.tsx");
  const html = await readFile("dist/index.html", "utf8");
  const markup = renderToString(createElement(App));
  await writeFile(
    "dist/index.html",
    html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`),
  );
  console.log(
    "HTML inicial renderizado: conteúdo, títulos e formulário disponíveis antes do JavaScript.",
  );
} finally {
  await vite.close();
}
