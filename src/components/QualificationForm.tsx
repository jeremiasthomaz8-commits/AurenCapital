import { useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { brand, money, type ServiceConfig } from "../config";
import { track } from "../analytics";
import { checkout } from "../checkout";
const initial = {
  name: "",
  email: "",
  phone: "",
  size: "",
  age: "",
  paidConsent: false,
  privacyConsent: false,
  website: "",
};
type FormValues = typeof initial;
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
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const sending = useRef(false);

  const update = <K extends keyof FormValues>(key: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: "" }));
    setServerError("");
  };
  function validate() {
    const next: Record<string, string> = {};
    if (values.name.trim().length < 3) next.name = "Informe seu nome completo.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim()))
      next.email = "Informe um e-mail válido.";
    if (!/^[1-9]{2}[2-9]\d{7,8}$/.test(values.phone.replace(/\D/g, "")))
      next.phone = "Informe um WhatsApp com DDD.";
    if (!values.size) next.size = "Selecione o porte da empresa.";
    if (!values.age) next.age = "Selecione o tempo de atividade.";
    if (!values.paidConsent || !values.privacyConsent)
      next.consent = "Confirme as condições e a privacidade.";
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
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending.current || values.website || !validate()) return;
    sending.current = true;
    setBusy(true);
    setServerError("");
    track("complete_qualification");
    track("begin_checkout");
    try {
      checkout.open();
    } catch {
      sending.current = false;
      setBusy(false);
      setServerError("Não foi possível abrir o pagamento. Tente novamente.");
    }
  }

  const props = (key: string) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? key + "-error" : undefined,
  });
  const error = (key: string) =>
    errors[key] ? (
      <span className="field-error" id={key + "-error"}>
        {errors[key]}
      </span>
    ) : null;
  return (
    <form ref={form} onSubmit={submit} noValidate className="short-form">
      <p>
        Preencha os dados para contratar seu diagnóstico por{" "}
        <strong>{money(config.priceCents ?? brand.draftPriceCents)}</strong>.
      </p>
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
      {(
        [
          ["name", "Nome completo", "text", "name", "Seu nome completo"],
          ["email", "E-mail", "email", "email", "voce@empresa.com.br"],
          [
            "phone",
            "Telefone (WhatsApp)",
            "tel",
            "tel-national",
            "(11) 99999-9999",
          ],
        ] as const
      ).map(([key, label, type, autoComplete, placeholder]) => (
        <div className="form-field" key={key}>
          <label htmlFor={key}>{label}</label>
          <input
            id={key}
            name={key}
            type={type}
            autoComplete={autoComplete}
            placeholder={placeholder}
            maxLength={key === "name" ? 100 : key === "email" ? 150 : 16}
            value={values[key]}
            onChange={(e) =>
              update(
                key,
                key === "phone" ? formatPhone(e.target.value) : e.target.value,
              )
            }
            required
            {...props(key)}
          />
          {error(key)}
        </div>
      ))}
      {(
        [
          {
            key: "size",
            label: "Porte da empresa",
            options: [
              "MEI",
              "ME (até R$360 mil/ano)",
              "EPP (de R$360 mil a R$4,8 milhões/ano)",
              "Acima de R$4,8 milhões/ano",
            ],
          },
          {
            key: "age",
            label: "Tempo de empresa ativa",
            options: [
              "Ainda não iniciou",
              "Menos de 1 ano",
              "De 1 a 3 anos",
              "Mais de 3 anos",
            ],
          },
        ] as const
      ).map(({ key, label, options }) => (
        <div className="form-field" key={key}>
          <label htmlFor={key}>{label}</label>
          <select
            id={key}
            name={key}
            value={values[key]}
            onChange={(e) => update(key, e.target.value)}
            required
            {...props(key)}
          >
            <option value="">Selecione uma opção</option>
            {options.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          {error(key)}
        </div>
      ))}
      <div className="consent-field">
        <label>
          <input
            type="checkbox"
            checked={values.paidConsent && values.privacyConsent}
            onChange={(e) => {
              update("paidConsent", e.target.checked);
              update("privacyConsent", e.target.checked);
              setErrors((previous) => ({ ...previous, consent: "" }));
            }}
            {...props("consent")}
          />
          <span>
            Aceito as condições do diagnóstico pago e o uso dos dados para
            atendimento, conforme a política de privacidade.
          </span>
        </label>
        {error("consent")}
      </div>
      <div className="short-form-links">
        <button type="button" className="text-button" onClick={onTerms}>
          Condições do serviço
        </button>
        <button type="button" className="text-button" onClick={onPrivacy}>
          Privacidade
        </button>
      </div>
      {serverError && (
        <p className="submit-error" role="alert">
          {serverError}
        </p>
      )}
      <button
        type="submit"
        className="button button-primary form-next"
        disabled={busy}
      >
        {busy ? (
          <>
            <LoaderCircle className="spin" size={18} /> Preparando pagamento…
          </>
        ) : (
          <>
            Ir para o pagamento <ArrowRight size={18} />
          </>
        )}
      </button>
      <p className="form-bottom">
        Você será direcionado ao pagamento seguro da Greenn.
      </p>
    </form>
  );
}
