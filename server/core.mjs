import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { DatabaseSync } from "node:sqlite";

export class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
export const enums = {
  active: ["Sim", "Não"],
  age: [
    "Ainda não iniciou",
    "Menos de 1 ano",
    "De 1 a 3 anos",
    "Mais de 3 anos",
  ],
  objective: [
    "Capital de giro",
    "Expansão do negócio",
    "Investimento em estrutura ou equipamentos",
    "Reorganização financeira",
    "Outro",
  ],
  revenue: [
    "Até R$ 10 mil",
    "De R$ 10 mil a R$ 30 mil",
    "De R$ 30 mil a R$ 100 mil",
    "Acima de R$ 100 mil",
    "Prefiro informar posteriormente",
  ],
  difficulty: [
    "Crédito negado",
    "Limites insuficientes",
    "Condições financeiras desfavoráveis",
    "Necessidade de planejamento",
    "Outra situação",
  ],
};
export function validateLead(input, legalVersion) {
  if (!input || typeof input !== "object" || input.website)
    throw new PublicError("Não foi possível validar o formulário.");
  const output = {};
  for (const [field, min, max] of [
    ["name", 3, 100],
    ...(input.size !== undefined ? [] : [["company", 2, 120]]),
    ["email", 5, 150],
    ["phone", 10, 11],
  ]) {
    if (
      typeof input[field] !== "string" ||
      input[field].trim().length < min ||
      input[field].length > max
    )
      throw new PublicError("Revise os campos obrigatórios do formulário.");
    output[field] = input[field].trim();
  }
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(output.email) ||
    !/^[1-9]{2}[2-9]\d{7,8}$/.test(output.phone)
  )
    throw new PublicError("Revise seu e-mail e WhatsApp.");
  const choices =
    input.size !== undefined
      ? {
          age: enums.age,
          size: [
            "MEI",
            "ME (até R$360 mil/ano)",
            "EPP (de R$360 mil a R$4,8 milhões/ano)",
            "Acima de R$4,8 milhões/ano",
          ],
        }
      : enums;
  for (const [key, options] of Object.entries(choices)) {
    if (!options.includes(input[key]))
      throw new PublicError("Revise as opções do questionário.");
    output[key] = input[key];
  }
  if (input.paidConsent !== true || input.privacyConsent !== true)
    throw new PublicError(
      "Confirme as informações sobre o serviço e a privacidade.",
    );
  if (input.legalVersion !== legalVersion)
    throw new PublicError(
      "As condições foram atualizadas. Recarregue a página antes de continuar.",
      409,
    );
  output.paidConsent = true;
  output.privacyConsent = true;
  output.legalVersion = legalVersion;
  output.attribution = Object.fromEntries(
    Object.entries(input.attribution ?? {}).filter(
      ([key, value]) =>
        [
          "utm_source",
          "utm_medium",
          "utm_campaign",
          "utm_content",
          "utm_term",
        ].includes(key) &&
        typeof value === "string" &&
        /^[\w .-]{1,100}$/.test(value),
    ),
  );
  return output;
}

export function encrypt(value, key) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString(
    "base64",
  );
}
export function decrypt(value, key) {
  const raw = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return JSON.parse(
    Buffer.concat([
      decipher.update(raw.subarray(28)),
      decipher.final(),
    ]).toString("utf8"),
  );
}
export const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

export function verifyWebhook(
  raw,
  timestamp,
  signature,
  secret,
  now = Date.now(),
) {
  if (
    !secret ||
    !/^\d{13}$/.test(timestamp ?? "") ||
    Math.abs(now - Number(timestamp)) > 300_000 ||
    !/^[a-f0-9]{64}$/.test(signature ?? "")
  )
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(raw)
    .digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

export function verifiedCheckoutUrl(raw, hosts) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new PublicError(
      "O provedor não retornou um endereço válido de pagamento.",
      502,
    );
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !hosts.includes(url.hostname) ||
    (url.port && url.port !== "443")
  )
    throw new PublicError(
      "O endereço de pagamento não pôde ser verificado.",
      502,
    );
  return url.href;
}

export function createRepository(path, key) {
  if (!Buffer.isBuffer(key) || key.length !== 32)
    throw new Error("DATA_ENCRYPTION_KEY precisa ter 32 bytes.");
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL,
      payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'qualified', amount_cents INTEGER NOT NULL,
      consent_at TEXT NOT NULL, legal_version TEXT NOT NULL, created_at TEXT NOT NULL,
      payment_reference TEXT UNIQUE, checkout_url TEXT, order_token TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS payment_events (
      id TEXT PRIMARY KEY, lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      status TEXT NOT NULL, received_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS leads_created_at ON leads(created_at);`);
  const find = (keyValue) =>
    db.prepare("SELECT * FROM leads WHERE idempotency_key = ?").get(keyValue);
  return {
    db,
    find,
    findByPayment: (ref) =>
      db.prepare("SELECT * FROM leads WHERE payment_reference = ?").get(ref),
    findByToken: (token) =>
      db.prepare("SELECT * FROM leads WHERE order_token = ?").get(token),
    create(input, idempotencyKey, amountCents, legalVersion) {
      const fingerprint = digest(input);
      const existing = find(idempotencyKey);
      if (existing) {
        if (
          existing.fingerprint !== fingerprint ||
          existing.amount_cents !== amountCents
        )
          throw new PublicError(
            "As informações ou o valor mudaram. Recarregue a página para iniciar uma nova contratação.",
            409,
          );
        return existing;
      }
      const now = new Date().toISOString();
      const id = `AC-${randomBytes(8).toString("hex").toUpperCase()}`;
      const token = randomBytes(32).toString("hex");
      db.prepare(
        "INSERT INTO leads (id,idempotency_key,fingerprint,payload,amount_cents,consent_at,legal_version,created_at,order_token) VALUES (?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        idempotencyKey,
        fingerprint,
        encrypt(input, key),
        amountCents,
        now,
        legalVersion,
        now,
        token,
      );
      return find(idempotencyKey);
    },
    attachCheckout(id, reference, url) {
      db.prepare(
        "UPDATE leads SET payment_reference=?,checkout_url=?,status='checkout_pending' WHERE id=? AND status='qualified'",
      ).run(reference, url, id);
    },
    applyPayment(event) {
      db.exec("BEGIN IMMEDIATE");
      try {
        if (
          db.prepare("SELECT id FROM payment_events WHERE id=?").get(event.id)
        ) {
          db.exec("COMMIT");
          return "duplicate";
        }
        const lead = db
          .prepare("SELECT * FROM leads WHERE payment_reference=?")
          .get(event.reference);
        if (!lead)
          throw new PublicError("Referência de pagamento desconhecida.", 404);
        if (event.currency !== "BRL" || event.amountCents !== lead.amount_cents)
          throw new PublicError("Valor ou moeda divergente.", 409);
        if (!["paid", "pending", "canceled", "failed"].includes(event.status))
          throw new PublicError("Status de pagamento inválido.");
        db.prepare("INSERT INTO payment_events VALUES (?,?,?,?)").run(
          event.id,
          lead.id,
          event.status,
          new Date().toISOString(),
        );
        if (!["paid", "onboarding", "completed"].includes(lead.status)) {
          const next = {
            paid: "paid",
            pending: "checkout_pending",
            canceled: "canceled",
            failed: "failed",
          }[event.status];
          db.prepare("UPDATE leads SET status=? WHERE id=?").run(next, lead.id);
        }
        db.exec("COMMIT");
        return "processed";
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    purge(before) {
      return db.prepare("DELETE FROM leads WHERE created_at < ?").run(before);
    },
    readPayload(id) {
      const lead = db.prepare("SELECT payload FROM leads WHERE id=?").get(id);
      return lead ? decrypt(lead.payload, key) : null;
    },
    close() {
      db.close();
    },
  };
}
