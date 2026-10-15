import http from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRepository,
  PublicError,
  validateLead,
  verifiedCheckoutUrl,
  verifyWebhook,
} from "./core.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile(resolve(root, ".env"));
} catch {
  /* Environment is optional in presentation mode. */
}
const business = JSON.parse(
  readFileSync(resolve(root, "business.json"), "utf8"),
);
const env = process.env;
const port = Number(env.PORT || 8787);
const origin = env.PUBLIC_ORIGIN || "http://127.0.0.1:5173";
const approvedCents = Number(env.APPROVED_PRICE_CENTS || 0);
const legalVersion = env.LEGAL_VERSION || business.legalVersion;
const checkoutHosts = (env.CHECKOUT_ALLOWED_HOSTS || "")
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);
const required = [
  "DATA_ENCRYPTION_KEY",
  "PAYMENT_BRIDGE_URL",
  "PAYMENT_BRIDGE_TOKEN",
  "WEBHOOK_SECRET",
  "SERVICE_CONDITIONS",
  "PRIVACY_NOTICE",
  "LEGAL_VERSION",
  "SUPPORT_WHATSAPP",
  "RETENTION_DAYS",
  "LEGAL_NAME",
  "CNPJ",
];
const enabled =
  env.CONTRACTING_ENABLED === "true" &&
  Number.isSafeInteger(approvedCents) &&
  approvedCents > 0 &&
  required.every((key) => env[key]) &&
  checkoutHosts.length > 0;
if (
  enabled &&
  (!/^https:\/\//.test(origin) ||
    !/^https:\/\//.test(env.PAYMENT_BRIDGE_URL) ||
    !/^\d{12,13}$/.test(env.SUPPORT_WHATSAPP) ||
    !/^\d{14}$/.test(env.CNPJ) ||
    !Number.isInteger(Number(env.RETENTION_DAYS)) ||
    Number(env.RETENTION_DAYS) < 1)
)
  throw new Error(
    "Revise a configuração de produção. Contratação requer HTTPS e dados oficiais válidos.",
  );
let repository = null;
if (enabled) {
  const path = resolve(env.DATABASE_PATH || resolve(root, "data/leads.db"));
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  repository = createRepository(
    path,
    Buffer.from(env.DATA_ENCRYPTION_KEY, "base64"),
  );
  const purge = () =>
    repository.purge(
      new Date(
        Date.now() - Number(env.RETENTION_DAYS) * 86400000,
      ).toISOString(),
    );
  purge();
  setInterval(purge, 6 * 3600000).unref();
}
const inFlight = new Map();
const attempts = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts)
    if (value.until < now) attempts.delete(key);
}, 60000).unref();
const headers = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
function json(res, status, body) {
  res.writeHead(status, {
    ...headers,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}
async function readBody(req) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > 16384)
      throw new PublicError("O formulário excede o tamanho permitido.", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function bridge(path, options = {}) {
  const response = await fetch(
    `${env.PAYMENT_BRIDGE_URL.replace(/\/$/, "")}${path}`,
    {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.PAYMENT_BRIDGE_TOKEN}`,
        ...options.headers,
      },
    },
  );
  if (!response.ok)
    throw new PublicError(
      "O provedor de pagamento está indisponível. Tente novamente em instantes.",
      502,
    );
  return response.json();
}
const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, origin).pathname;
  if (req.headers.origin === origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Idempotency-Key",
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(req.headers.origin === origin ? 204 : 403);
    res.end();
    return;
  }
  try {
    if (pathname === "/api/config" && req.method === "GET")
      return json(res, 200, {
        available: enabled,
        priceCents: enabled ? approvedCents : null,
        currency: "BRL",
        serviceName: business.serviceName,
        legalVersion,
        conditions: enabled ? env.SERVICE_CONDITIONS : null,
        privacyNotice: enabled ? env.PRIVACY_NOTICE : null,
      });
    if (pathname === "/api/qualifications" && req.method === "POST") {
      if (!enabled)
        throw new PublicError(
          "A contratação ainda está em preparação. Nenhum dado foi registrado.",
          503,
        );
      if (req.headers.origin !== origin)
        throw new PublicError("Origem não autorizada.", 403);
      if (!req.headers["content-type"]?.startsWith("application/json"))
        throw new PublicError("Formato de envio inválido.", 415);
      const ip = req.socket.remoteAddress; // Never trust X-Forwarded-For without an explicitly trusted reverse proxy.
      const attempt = attempts.get(ip) || {
        count: 0,
        until: Date.now() + 600000,
      };
      if (++attempt.count > 15 && attempt.until > Date.now())
        throw new PublicError(
          "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
          429,
        );
      attempts.set(ip, attempt);
      const idempotency = req.headers["idempotency-key"];
      if (
        typeof idempotency !== "string" ||
        !/^[a-f0-9-]{36}$/.test(idempotency)
      )
        throw new PublicError("Identificador inválido. Recarregue a página.");
      const input = JSON.parse((await readBody(req)).toString("utf8"));
      if (input.quotedPriceCents !== approvedCents)
        throw new PublicError(
          "O valor do serviço foi atualizado. Recarregue a página para conferir as condições antes de continuar.",
          409,
        );
      const leadInput = validateLead(input, legalVersion);
      const lead = repository.create(
        leadInput,
        idempotency,
        approvedCents,
        legalVersion,
      );
      if (lead.checkout_url)
        return json(res, 200, { checkoutUrl: lead.checkout_url });
      if (!inFlight.has(idempotency)) {
        const job = (async () => {
          const returnUrl = `${origin}/?order=${lead.order_token}`;
          const result = await bridge("/checkouts", {
            method: "POST",
            headers: { "Idempotency-Key": lead.id },
            body: JSON.stringify({
              orderId: lead.id,
              amountCents: lead.amount_cents,
              currency: "BRL",
              description: business.serviceName,
              returnUrl,
              customer: {
                name: leadInput.name,
                email: leadInput.email,
                phone: leadInput.phone,
              },
            }),
          });
          const checkoutUrl = verifiedCheckoutUrl(result.url, checkoutHosts);
          if (
            typeof result.reference !== "string" ||
            !/^[A-Za-z0-9_-]{1,150}$/.test(result.reference)
          )
            throw new PublicError("Referência de pagamento inválida.", 502);
          repository.attachCheckout(lead.id, result.reference, checkoutUrl);
          return checkoutUrl;
        })();
        inFlight.set(idempotency, job);
      }
      try {
        return json(res, 200, { checkoutUrl: await inFlight.get(idempotency) });
      } finally {
        inFlight.delete(idempotency);
      }
    }
    if (pathname === "/api/payments/webhook" && req.method === "POST") {
      if (!enabled) throw new PublicError("Integração indisponível.", 503);
      const raw = await readBody(req);
      if (
        !verifyWebhook(
          raw,
          req.headers["x-auren-timestamp"],
          req.headers["x-auren-signature"],
          env.WEBHOOK_SECRET,
        )
      )
        throw new PublicError("Assinatura inválida.", 401);
      const event = JSON.parse(raw.toString("utf8"));
      if (
        typeof event.id !== "string" ||
        !/^[A-Za-z0-9_-]{1,150}$/.test(event.id) ||
        typeof event.reference !== "string" ||
        !/^[A-Za-z0-9_-]{1,150}$/.test(event.reference)
      )
        throw new PublicError("Evento inválido.");
      const confirmed = await bridge(
        `/payments/${encodeURIComponent(event.reference)}`,
        { method: "GET" },
      );
      if (
        confirmed.reference !== event.reference ||
        confirmed.status !== event.status ||
        confirmed.amountCents !== event.amountCents ||
        confirmed.currency !== event.currency
      )
        throw new PublicError(
          "O evento não corresponde à confirmação do provedor.",
          409,
        );
      return json(res, 200, { result: repository.applyPayment(event) });
    }
    if (
      /^\/api\/orders\/[a-f0-9]{64}$/.test(pathname) &&
      req.method === "GET"
    ) {
      const lead = repository?.findByToken(pathname.split("/").at(-1));
      if (!lead) throw new PublicError("Pedido não encontrado.", 404);
      const paid = ["paid", "onboarding", "completed"].includes(lead.status);
      return json(res, 200, {
        status: lead.status,
        reference: lead.id,
        whatsappUrl: paid
          ? `https://wa.me/${env.SUPPORT_WHATSAPP}?text=${encodeURIComponent(`Olá! Meu diagnóstico Auren Capital tem a referência ${lead.id}. Gostaria das orientações para iniciar.`)}`
          : null,
      });
    }
    if (pathname.startsWith("/api/"))
      throw new PublicError("Recurso não encontrado.", 404);
    if (req.method !== "GET" && req.method !== "HEAD")
      throw new PublicError("Método não permitido.", 405);
    const dist = resolve(root, "dist");
    const decoded = decodeURIComponent(pathname);
    if (decoded.split("/").some((segment) => segment.startsWith(".")))
      throw new PublicError("Recurso não encontrado.", 404);
    let file = resolve(dist, `.${decoded}`);
    if (
      !file.startsWith(`${dist}/`) &&
      !file.startsWith(`${dist}\\`) &&
      file !== dist
    )
      throw new PublicError("Recurso não encontrado.", 404);
    if (!existsSync(file) || file === dist) file = resolve(dist, "index.html");
    if (!existsSync(file))
      throw new PublicError(
        "Execute npm run build para preparar a página.",
        503,
      );
    const types = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".svg": "image/svg+xml",
      ".woff2": "font/woff2",
      ".woff": "font/woff",
      ".png": "image/png",
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
    };
    res.writeHead(200, {
      ...headers,
      "Content-Type": types[extname(file)] || "application/octet-stream",
      "Cache-Control": pathname.startsWith("/assets/")
        ? "public,max-age=31536000,immutable"
        : "no-cache",
    });
    res.end(req.method === "HEAD" ? undefined : readFileSync(file));
  } catch (error) {
    if (error instanceof PublicError)
      json(res, error.status, { message: error.message });
    else if (error instanceof SyntaxError)
      json(res, 400, {
        message: "O formulário não pôde ser lido. Revise as informações.",
      });
    else {
      console.error(
        "Falha de operação:",
        error?.code || error?.name || "Unknown",
      );
      json(res, 500, {
        message:
          "Não foi possível concluir esta etapa. Tente novamente em instantes.",
      });
    }
  }
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(port, env.HOST || "127.0.0.1", () =>
  console.log(
    `Auren Capital: http://${env.HOST || "127.0.0.1"}:${port} (${enabled ? "contratação habilitada" : "apresentação, sem coleta de dados"})`,
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () =>
    server.close(() => {
      repository?.close();
      process.exit(0);
    }),
  );
