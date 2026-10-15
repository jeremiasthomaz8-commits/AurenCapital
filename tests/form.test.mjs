import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

test("questionário valida campos, preserva respostas e permite revisar sem enviar dados na prévia", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="test"></div></body></html>',
    { url: "https://presentation.example/" },
  );
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.requestAnimationFrame = (callback) => {
    callback();
    return 1;
  };
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const { createElement, act } = await import("react");
  const { createRoot } = await import("react-dom/client");
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: "custom",
  });
  const { QualificationForm } = await vite.ssrLoadModule(
    "/src/components/QualificationForm.tsx",
  );
  const { fallbackConfig } = await vite.ssrLoadModule("/src/config.ts");
  const root = createRoot(document.getElementById("test"));
  let fetchCount = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    fetchCount++;
    throw new Error("Unexpected transmission");
  };
  const submit = async () =>
    act(async () => {
      document
        .querySelector("form")
        .dispatchEvent(
          new dom.window.Event("submit", { bubbles: true, cancelable: true }),
        );
    });
  const text = () => document.body.textContent;
  const field = async (id, value) =>
    act(async () => {
      const node = document.getElementById(id);
      const prototype =
        node.tagName === "SELECT"
          ? dom.window.HTMLSelectElement.prototype
          : dom.window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, "value").set.call(node, value);
      node.dispatchEvent(
        new dom.window.Event(node.tagName === "SELECT" ? "change" : "input", {
          bubbles: true,
        }),
      );
    });
  try {
    await act(async () =>
      root.render(
        createElement(QualificationForm, {
          config: fallbackConfig,
          onPrivacy() {},
          onTerms() {},
        }),
      ),
    );
    await submit();
    assert.match(text(), /Informe seu nome/);
    assert.match(text(), /Etapa 1 de 4/);
    await field("name", "Pessoa de Teste");
    await field("company", "Empresa de Teste");
    await act(async () =>
      document.querySelector('input[name="active"][value="Não"]').click(),
    );
    assert.match(text(), /direcionado a empresas/);
    await act(async () =>
      document.querySelector('input[name="active"][value="Sim"]').click(),
    );
    await field("age", "De 1 a 3 anos");
    await submit();
    assert.match(text(), /Etapa 2 de 4/);
    await field("objective", "Capital de giro");
    await field("revenue", "Prefiro informar posteriormente");
    await field("difficulty", "Crédito negado");
    await submit();
    assert.match(text(), /Etapa 3 de 4/);
    await field("phone", "11987654321");
    await field("email", "invalido");
    await submit();
    assert.match(text(), /Informe um e-mail válido/);
    assert.equal(document.getElementById("phone").value, "(11) 98765-4321");
    await field("email", "teste@example.com");
    for (const checkbox of document.querySelectorAll(".consent-field input"))
      await act(async () => checkbox.click());
    await submit();
    assert.match(text(), /Etapa 4 de 4/);
    assert.match(text(), /Empresa de Teste/);
    assert.match(text(), /Valor a confirmar/);
    assert.equal(
      document.querySelector('button[type="submit"]').disabled,
      true,
    );
    await act(async () => document.querySelector(".back-button").click());
    assert.equal(document.getElementById("email").value, "teste@example.com");
    assert.equal(fetchCount, 0);
    assert.equal(dom.window.localStorage.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    await act(async () => root.unmount());
    await vite.close();
    dom.window.close();
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.HTMLElement;
    delete globalThis.requestAnimationFrame;
    delete globalThis.IS_REACT_ACT_ENVIRONMENT;
  }
});
