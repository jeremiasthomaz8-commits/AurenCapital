import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import {
  createRepository,
  encrypt,
  decrypt,
  validateLead,
  verifyWebhook,
  verifiedCheckoutUrl,
} from "../server/core.mjs";

const fixture = () => ({
  name: "Pessoa de Teste",
  company: "Empresa de Teste",
  email: "teste@example.com",
  phone: "11987654321",
  active: "Sim",
  age: "De 1 a 3 anos",
  objective: "Capital de giro",
  revenue: "Até R$ 10 mil",
  difficulty: "Crédito negado",
  paidConsent: true,
  privacyConsent: true,
  legalVersion: "teste-v1",
  website: "",
  attribution: {},
});

test("validação exige consentimentos, versões atuais e escolhas válidas", () => {
  assert.equal(validateLead(fixture(), "teste-v1").company, "Empresa de Teste");
  assert.throws(() =>
    validateLead({ ...fixture(), paidConsent: false }, "teste-v1"),
  );
  assert.throws(() => validateLead(fixture(), "teste-v2"));
  assert.throws(() =>
    validateLead({ ...fixture(), revenue: "valor não previsto" }, "teste-v1"),
  );
  assert.throws(() =>
    validateLead({ ...fixture(), phone: "00000000000" }, "teste-v1"),
  );
  assert.throws(() =>
    validateLead({ ...fixture(), website: "spam" }, "teste-v1"),
  );
});
test("dados pessoais são cifrados com integridade autenticada", () => {
  const key = randomBytes(32);
  const encrypted = encrypt(fixture(), key);
  assert.ok(!encrypted.includes("teste@example.com"));
  assert.deepEqual(decrypt(encrypted, key), fixture());
  const tampered = Buffer.from(encrypted, "base64");
  tampered[tampered.length - 1] ^= 1;
  assert.throws(() => decrypt(tampered.toString("base64"), key));
});
test("duplo envio reutiliza o lead e bloqueia alterações com a mesma chave", () => {
  const repo = createRepository(":memory:", randomBytes(32));
  try {
    const lead = repo.create(fixture(), "key-1", 8900, "teste-v1");
    assert.equal(repo.create(fixture(), "key-1", 8900, "teste-v1").id, lead.id);
    assert.equal(
      repo.db.prepare("SELECT count(*) AS count FROM leads").get().count,
      1,
    );
    assert.throws(() =>
      repo.create(
        { ...fixture(), company: "Outra empresa" },
        "key-1",
        8900,
        "teste-v1",
      ),
    );
    assert.throws(() => repo.create(fixture(), "key-1", 9900, "teste-v1"));
    assert.equal(repo.readPayload(lead.id).email, fixture().email);
    assert.ok(!repo.find("key-1").payload.includes(fixture().email));
  } finally {
    repo.close();
  }
});
test("pagamento é idempotente, exige valor correto e nunca regride de pago", () => {
  const repo = createRepository(":memory:", randomBytes(32));
  try {
    const lead = repo.create(fixture(), "key-2", 8900, "teste-v1");
    repo.attachCheckout(
      lead.id,
      "provider-123",
      "https://checkout.example.com/order",
    );
    const event = {
      id: "event-1",
      reference: "provider-123",
      amountCents: 8900,
      currency: "BRL",
      status: "paid",
    };
    assert.throws(() => repo.applyPayment({ ...event, amountCents: 1 }));
    assert.equal(repo.find("key-2").status, "checkout_pending");
    assert.equal(repo.applyPayment(event), "processed");
    assert.equal(repo.applyPayment(event), "duplicate");
    repo.applyPayment({ ...event, id: "event-2", status: "pending" });
    assert.equal(repo.find("key-2").status, "paid");
    repo.purge(new Date(Date.now() + 1000).toISOString());
    assert.equal(repo.find("key-2"), undefined);
    assert.equal(
      repo.db.prepare("SELECT count(*) AS count FROM payment_events").get()
        .count,
      0,
    );
  } finally {
    repo.close();
  }
});
test("webhook exige assinatura e rejeita replay fora da janela", () => {
  const raw = Buffer.from('{"status":"paid"}');
  const timestamp = String(Date.now());
  const signature = createHmac("sha256", "test-only-secret")
    .update(`${timestamp}.`)
    .update(raw)
    .digest("hex");
  assert.equal(
    verifyWebhook(raw, timestamp, signature, "test-only-secret"),
    true,
  );
  assert.equal(verifyWebhook(raw, timestamp, signature, "wrong-secret"), false);
  assert.equal(
    verifyWebhook(
      raw,
      timestamp,
      signature,
      "test-only-secret",
      Date.now() + 360000,
    ),
    false,
  );
  assert.equal(
    verifyWebhook(
      Buffer.from("changed"),
      timestamp,
      signature,
      "test-only-secret",
    ),
    false,
  );
});
test("checkout aceita apenas HTTPS no domínio explicitamente autorizado", () => {
  assert.equal(
    verifiedCheckoutUrl("https://checkout.example.com/pay", [
      "checkout.example.com",
    ]),
    "https://checkout.example.com/pay",
  );
  for (const url of [
    "http://checkout.example.com/pay",
    "https://checkout.example.com.attacker.com/pay",
    "https://user@checkout.example.com/pay",
    "javascript:alert(1)",
    "https://checkout.example.com:8443/pay",
  ])
    assert.throws(() => verifiedCheckoutUrl(url, ["checkout.example.com"]));
});

test("formulário curto aceita porte e tempo de atividade sem inventar dados da empresa", () => {
  const data = {
    name: "Pessoa de Teste",
    email: "teste@example.com",
    phone: "11987654321",
    size: "ME (até R$360 mil/ano)",
    age: "De 1 a 3 anos",
    paidConsent: true,
    privacyConsent: true,
    legalVersion: "teste-v1",
    website: "",
  };
  const result = validateLead(data, "teste-v1");
  assert.equal(result.size, data.size);
  assert.equal(result.company, undefined);
  assert.throws(() => validateLead({ ...data, size: "inválido" }, "teste-v1"));
  assert.throws(() => validateLead({ ...data, age: "" }, "teste-v1"));
  assert.throws(() =>
    validateLead({ ...data, privacyConsent: false }, "teste-v1"),
  );
});
