import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { apiBase, money, type ServiceConfig } from "../config";
import { attribution, track } from "../analytics";
import { Eyebrow } from "./ui";

const initial = {
  name: "",
  company: "",
  active: "",
  age: "",
  objective: "",
  revenue: "",
  difficulty: "",
  phone: "",
  email: "",
  paidConsent: false,
  privacyConsent: false,
  website: "",
};
type FormValues = typeof initial;
const labels = ["Sua empresa", "Seu momento", "Seu contato", "Revisão"];

export function formatPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const split = digits.length > 10 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

export function QualificationForm({
  config,
  onPrivacy,
  onTerms,
}: {
  config: ServiceConfig;
  onPrivacy: () => void;
  onTerms: () => void;
}) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);
  const attemptKey = useRef(crypto.randomUUID());
  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setServerError("");
  };
  function validate() {
    const next: Record<string, string> = {};
    if (step === 0) {
      if (values.name.trim().length < 3)
        next.name = "Informe seu nome (mínimo 3 caracteres).";
      if (values.company.trim().length < 2)
        next.company = "Informe o nome da empresa.";
      if (!values.active) next.active = "Selecione uma opção.";
      if (!values.age) next.age = "Selecione o tempo de atividade.";
    }
    if (step === 1)
      ["objective", "revenue", "difficulty"].forEach((key) => {
        if (!values[key as keyof FormValues])
          next[key] = "Selecione uma opção.";
      });
    if (step === 2) {
      if (!/^[1-9]{2}[2-9]\d{7,8}$/.test(values.phone.replace(/\D/g, "")))
        next.phone = "Informe um WhatsApp com DDD.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
        next.email = "Informe um e-mail válido.";
      if (!values.paidConsent)
        next.paidConsent = "Confirme que o diagnóstico é pago.";
      if (!values.privacyConsent)
        next.privacyConsent = "Leia e confirme a informação de privacidade.";
    }
    setErrors(next);
    if (Object.keys(next).length)
      setTimeout(
        () =>
          form.current
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus(),
        0,
      );
    return Object.keys(next).length === 0;
  }
  function move(next: number) {
    setStep(next);
    setErrors({});
    setServerError("");
    requestAnimationFrame(() =>
      heading.current?.focus({ preventScroll: true }),
    );
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current) return;
    if (step < 3) {
      if (!validate()) return;
      if (step === 0) track("start_qualification");
      if (step === 2) track("complete_qualification");
      move(step + 1);
      return;
    }
    if (!config.available) {
      setServerError(
        "Contratação indisponível. Nenhum dado enviado ou pagamento realizado.",
      );
      return;
    }
    sending.current = true;
    setBusy(true);
    setServerError("");
    try {
      const response = await fetch(`${apiBase}/api/qualifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attemptKey.current,
        },
        body: JSON.stringify({
          ...values,
          phone: values.phone.replace(/\D/g, ""),
          email: values.email.trim(),
          attribution: attribution(),
          legalVersion: config.legalVersion,
          quotedPriceCents: config.priceCents,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(
          data.message || "Não foi possível contratar. Tente novamente.",
        );
      const url = new URL(data.checkoutUrl);
      if (url.protocol !== "https:")
        throw new Error("Endereço de pagamento não verificado.");
      track("begin_checkout");
      window.location.assign(url.toString());
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "Verifique sua conexão e tente novamente.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  const error = (key: string) =>
    errors[key] ? (
      <span className="field-error" id={`${key}-error`}>
        {errors[key]}
      </span>
    ) : null;
  const props = (key: string) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `${key}-error` : undefined,
  });
  const select = (
    key: "age" | "objective" | "revenue" | "difficulty",
    label: string,
    options: string[],
  ) => (
    <div className="form-field">
      <label htmlFor={key}>{label}</label>
      <select
        id={key}
        value={values[key]}
        onChange={(event) => update(key, event.target.value)}
        {...props(key)}
      >
        <option value="">Selecione uma opção</option>
        {options.map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      {error(key)}
    </div>
  );
  return (
    <section className="section qualification-section" id="diagnostico">
      <div className="container qualification-grid">
        <div className="qualification-copy">
          <Eyebrow>Vamos entender sua empresa</Eyebrow>
          <h2>
            Seu próximo passo <br />
            <span className="soft-color">começa aqui.</span>
          </h2>
          <p>
            Conte sobre sua empresa e revise os dados e as condições antes de
            contratar.
          </p>
          <div className="qualification-benefits">
            <span>
              <ClipboardCheck size={20} />
              Perguntas sem documentos
            </span>
            <span>
              <LockKeyhole size={20} />
              Sem dados bancários ou senhas
            </span>
            <span>
              <ShieldCheck size={20} />
              Sem compromisso nesta etapa
            </span>
          </div>
          {!config.available && (
            <p className="preview-notice">
              <span />
              Explore o questionário nesta prévia. Suas respostas não são
              enviadas.
            </p>
          )}
        </div>
        <div className="form-card">
          <ol className="form-progress" aria-label="Etapas do questionário">
            {labels.map((label, i) => (
              <li
                key={label}
                className={step >= i ? "active" : ""}
                aria-current={step === i ? "step" : undefined}
              >
                <span>{step > i ? <Check size={13} /> : i + 1}</span>
                <small>{label}</small>
              </li>
            ))}
          </ol>
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Progresso do questionário"
            aria-valuenow={step + 1}
            aria-valuemin={1}
            aria-valuemax={4}
          >
            <span style={{ width: `${(step + 1) * 25}%` }} />
          </div>
          <form ref={form} onSubmit={submit} noValidate>
            <div className="form-step" key={step}>
              <span className="form-step-count">Etapa {step + 1} de 4</span>
              <h3 ref={heading} tabIndex={-1}>
                {
                  [
                    "Vamos nos conhecer.",
                    "Seu momento financeiro.",
                    "Como falar com você?",
                    "Revise suas informações.",
                  ][step]
                }
              </h3>
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="website">Site</label>
                <input
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.website}
                  onChange={(e) => update("website", e.target.value)}
                />
              </div>
              {step === 0 && (
                <>
                  <div className="form-field">
                    <label htmlFor="name">Seu nome</label>
                    <input
                      id="name"
                      autoComplete="name"
                      maxLength={100}
                      placeholder="Seu nome completo"
                      value={values.name}
                      onChange={(e) => update("name", e.target.value)}
                      {...props("name")}
                    />
                    {error("name")}
                  </div>
                  <div className="form-field">
                    <label htmlFor="company">Nome da empresa</label>
                    <input
                      id="company"
                      autoComplete="organization"
                      maxLength={120}
                      placeholder="Nome da empresa"
                      value={values.company}
                      onChange={(e) => update("company", e.target.value)}
                      {...props("company")}
                    />
                    {error("company")}
                  </div>
                  <fieldset className="radio-field">
                    <legend>Possui CNPJ ativo?</legend>
                    <div className="radio-options">
                      {["Sim", "Não"].map((value) => (
                        <label
                          key={value}
                          className={values.active === value ? "selected" : ""}
                        >
                          <input
                            type="radio"
                            name="active"
                            value={value}
                            checked={values.active === value}
                            onChange={() => update("active", value)}
                            {...props("active")}
                          />
                          {value}
                        </label>
                      ))}
                    </div>
                    {error("active")}
                  </fieldset>
                  {values.active === "Não" && (
                    <p className="field-notice">
                      Este diagnóstico é direcionado a empresas. Explore as
                      etapas e confirme a adequação ao seu caso antes de
                      contratar.
                    </p>
                  )}
                  {select("age", "Tempo de atividade da empresa", [
                    "Ainda não iniciou",
                    "Menos de 1 ano",
                    "De 1 a 3 anos",
                    "Mais de 3 anos",
                  ])}
                </>
              )}
              {step === 1 && (
                <>
                  {select("objective", "Para que você busca crédito?", [
                    "Capital de giro",
                    "Expansão do negócio",
                    "Investimento em estrutura ou equipamentos",
                    "Reorganização financeira",
                    "Outro",
                  ])}
                  {select("revenue", "Faturamento médio mensal aproximado", [
                    "Até R$ 10 mil",
                    "De R$ 10 mil a R$ 30 mil",
                    "De R$ 30 mil a R$ 100 mil",
                    "Acima de R$ 100 mil",
                    "Prefiro informar posteriormente",
                  ])}
                  {select("difficulty", "Principal dificuldade atual", [
                    "Crédito negado",
                    "Limites insuficientes",
                    "Condições financeiras desfavoráveis",
                    "Necessidade de planejamento",
                    "Outra situação",
                  ])}
                </>
              )}
              {step === 2 && (
                <>
                  <div className="form-field">
                    <label htmlFor="phone">Seu WhatsApp</label>
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="(11) 99999-9999"
                      value={values.phone}
                      onChange={(e) =>
                        update("phone", formatPhone(e.target.value))
                      }
                      {...props("phone")}
                    />
                    {error("phone")}
                  </div>
                  <div className="form-field">
                    <label htmlFor="email">Seu e-mail</label>
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      maxLength={150}
                      placeholder="voce@empresa.com.br"
                      value={values.email}
                      onChange={(e) => update("email", e.target.value)}
                      {...props("email")}
                    />
                    {error("email")}
                  </div>
                  <div className="consent-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={values.paidConsent}
                        onChange={(e) =>
                          update("paidConsent", e.target.checked)
                        }
                        {...props("paidConsent")}
                      />
                      <span>
                        Entendo: o diagnóstico é um{" "}
                        <strong>serviço pago</strong> e não garante crédito.
                      </span>
                    </label>
                    {error("paidConsent")}
                  </div>
                  <div className="consent-field">
                    <label>
                      <input
                        type="checkbox"
                        checked={values.privacyConsent}
                        onChange={(e) =>
                          update("privacyConsent", e.target.checked)
                        }
                        {...props("privacyConsent")}
                      />
                      <span>
                        {config.available
                          ? "Autorizo o uso dos dados para qualificação e atendimento, conforme a informação de privacidade."
                          : "Entendo que, nesta prévia, as respostas ficam na página, sem envio."}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-button privacy-link"
                      onClick={onPrivacy}
                    >
                      Ler sobre privacidade
                    </button>
                    {error("privacyConsent")}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <div className="review-summary">
                    <span>Diagnóstico Financeiro Empresarial</span>
                    <strong>
                      {config.priceCents !== null
                        ? money(config.priceCents)
                        : "Valor a confirmar"}
                    </strong>
                    <p>
                      Diagnóstico pago, com orientação inicial. Consultorias
                      adicionais à parte.
                    </p>
                  </div>
                  <dl className="review-details">
                    <div>
                      <dt>Nome</dt>
                      <dd>{values.name}</dd>
                    </div>
                    <div>
                      <dt>Empresa</dt>
                      <dd>{values.company}</dd>
                    </div>
                    <div>
                      <dt>Objetivo</dt>
                      <dd>{values.objective}</dd>
                    </div>
                    <div>
                      <dt>WhatsApp</dt>
                      <dd>{values.phone}</dd>
                    </div>
                    <div>
                      <dt>E-mail</dt>
                      <dd>{values.email}</dd>
                    </div>
                  </dl>
                  <button
                    className="text-button"
                    type="button"
                    onClick={onTerms}
                  >
                    Ver escopo e condições <ArrowUpRight size={13} />
                  </button>
                  {!config.available && (
                    <p className="field-notice">
                      Contratação em preparação: valor, escopo e pagamento
                      aguardam confirmação. Nenhum dado enviado.
                    </p>
                  )}
                  {config.available && (
                    <p className="field-notice">{config.conditions}</p>
                  )}
                </>
              )}
            </div>
            {serverError && (
              <p className="submit-error" role="alert">
                {serverError}
              </p>
            )}
            <div className="form-actions">
              {step > 0 && (
                <button
                  type="button"
                  className="back-button"
                  onClick={() => move(step - 1)}
                  disabled={busy}
                >
                  <ArrowLeft size={16} /> Voltar
                </button>
              )}
              <button
                type="submit"
                className="button button-primary form-next"
                disabled={busy || (step === 3 && !config.available)}
              >
                {busy ? (
                  <>
                    <LoaderCircle className="spin" size={18} /> Preparando
                    pagamento…
                  </>
                ) : (
                  <>
                    {step === 3
                      ? config.available
                        ? "Ir para pagamento"
                        : "Contratação em preparação"
                      : step === 2
                        ? "Revisar informações"
                        : "Continuar"}
                    {step < 3 && <ArrowRight size={17} />}
                  </>
                )}
              </button>
            </div>
            <p className="form-bottom">
              <LockKeyhole size={12} />
              {config.available
                ? "Revise tudo antes de pagar."
                : "Nenhum dado enviado nesta prévia."}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
