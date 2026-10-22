import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

test("formulário curto valida cinco campos e não envia dados na prévia", async () => {
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
    assert.equal(document.querySelectorAll(".form-field").length, 5);
    assert.equal(document.getElementById("company"), null);
    await field("name", "Pessoa de Teste");
    await field("age", "De 1 a 3 anos");
    await field("size", "ME (até R$360 mil/ano)");
    await field("phone", "11987654321");
    await field("email", "invalido");
    await submit();
    assert.match(text(), /Informe um e-mail válido/);
    assert.equal(document.getElementById("phone").value, "(11) 98765-4321");
    await field("email", "teste@example.com");
    await act(async () =>
      document.querySelector(".consent-field input").click(),
    );
    await submit();
    assert.match(text(), /Contratação indisponível/);
    assert.equal(
      document.querySelector('button[type="submit"]').disabled,
      true,
    );
    assert.equal(document.getElementById("email").value, "teste@example.com");
    assert.equal(fetchCount, 0);
    assert.equal(dom.window.localStorage.length, 0);
    let sent;
    globalThis.fetch = async (_url, options) => {
      sent = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => ({ checkoutUrl: "http://invalid.example" }),
      };
    };
    await act(async () =>
      root.render(
        createElement(QualificationForm, {
          config: { ...fallbackConfig, available: true, priceCents: 8990 },
          onPrivacy() {},
          onTerms() {},
        }),
      ),
    );
    await submit();
    assert.equal(sent.size, "ME (até R$360 mil/ano)");
    assert.equal(sent.phone, "11987654321");
    assert.equal(sent.quotedPriceCents, 8990);
    assert.equal(sent.company, undefined);
    assert.match(text(), /Endereço de pagamento não verificado/);
    globalThis.Element = dom.window.Element;
    dom.window.HTMLDialogElement.prototype.showModal = function () {
      this.setAttribute("open", "");
    };
    dom.window.HTMLDialogElement.prototype.close = function () {
      this.removeAttribute("open");
    };
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => fallbackConfig,
    });
    const { default: App } = await vite.ssrLoadModule("/src/App.tsx");
    await act(async () => root.render(createElement(App)));
    assert.equal(document.querySelector("form"), null);
    await act(async () => document.querySelector(".header-cta").click());
    assert.equal(
      document.querySelector("dialog[open] .short-form .form-field label")
        .textContent,
      "Nome completo",
    );
    await field("name", "Nome preservado");
    await act(async () =>
      document.querySelector(".short-form-links button").click(),
    );
    assert.equal(document.querySelectorAll("dialog[open]").length, 2);
    const titles = [...document.querySelectorAll("dialog")].map((d) =>
      d.getAttribute("aria-labelledby"),
    );
    assert.notEqual(titles[0], titles[1]);
    await act(async () =>
      [...document.querySelectorAll("dialog")]
        .at(-1)
        .querySelector('[aria-label="Fechar"]')
        .click(),
    );
    assert.equal(document.getElementById("name").value, "Nome preservado");
    await act(async () =>
      document
        .querySelector("dialog")
        .dispatchEvent(new dom.window.Event("cancel", { cancelable: true })),
    );
    assert.equal(document.querySelector("dialog"), null);
    delete globalThis.Element;
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
