import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { apiBase, brand, fallbackConfig, type ServiceConfig } from "./config";
import { allowAnalytics, track } from "./analytics";
import { Logo, PrimaryButton } from "./components/ui";
import {
  Hero,
  ProblemAwareness,
  PainPoints,
  Solution,
  FounderSection,
  ProcessTimeline,
  Differentiators,
  PricingOffer,
  TrustSection,
  EducationalContent,
  ConversionSection,
} from "./components/LandingSections";
import { QualificationForm } from "./components/QualificationForm";
import { FAQAccordion } from "./components/FAQAccordion";
import { Dialog } from "./components/Dialog";

const nav = [
  ["Como funciona", "#como-funciona"],
  ["O diagnóstico", "#o-diagnostico"],
  ["Sobre Vandilton", "#sobre"],
  ["Dúvidas", "#duvidas"],
];
type Modal = "privacy" | "terms" | "preferences" | "contact" | null;

export default function App() {
  const [config, setConfig] = useState<ServiceConfig>(fallbackConfig);
  const [formOpen, setFormOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [analytics, setAnalytics] = useState(() => {
    try {
      return localStorage.getItem("auren:analytics") === "yes";
    } catch {
      return false;
    }
  });
  const [preferenceDraft, setPreferenceDraft] = useState(analytics);
  const [paymentNotice, setPaymentNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiBase}/api/config`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (
          data &&
          typeof data.available === "boolean" &&
          (data.priceCents === null || Number.isInteger(data.priceCents))
        )
          setConfig(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    allowAnalytics(analytics);
    if (analytics) track("view_landing_page");
  }, [analytics]);
  useEffect(() => {
    if (modal === "preferences") setPreferenceDraft(analytics);
  }, [modal, analytics]);
  useEffect(() => {
    if (!menuOpen) return;
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        document.querySelector<HTMLButtonElement>(".menu-toggle")?.focus();
      }
    };
    document.addEventListener("keydown", closeMenu);
    return () => document.removeEventListener("keydown", closeMenu);
  }, [menuOpen]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("payment"))
      setPaymentNotice(
        "Voltar do checkout não confirma o pagamento. Consulte seu link seguro de acompanhamento.",
      );
    const token = params.get("order");
    if (!token || !/^[a-f0-9]{64}$/.test(token)) return;
    fetch(`${apiBase}/api/orders/${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "paid" || data.status === "onboarding") {
          setPaymentNotice(
            `Pagamento confirmado. Pedido ${data.reference}. A equipe orientará o início do diagnóstico.`,
          );
          if (
            data.whatsappUrl &&
            /^https:\/\/wa\.me\/\d+\?text=/.test(data.whatsappUrl)
          ) {
            const link = document.getElementById(
              "post-purchase-whatsapp",
            ) as HTMLAnchorElement | null;
            if (link) {
              link.href = data.whatsappUrl;
              link.hidden = false;
            }
          }
        } else
          setPaymentNotice(
            data.status === "canceled"
              ? "Pagamento cancelado. Você pode iniciar outra contratação."
              : data.status === "failed"
                ? "Pagamento não concluído. Confira as condições no provedor antes de tentar de novo."
                : "Pagamento pendente. O atendimento começa após a confirmação pelo provedor.",
          );
      })
      .catch(() =>
        setPaymentNotice(
          "Não foi possível consultar o pedido. Tente de novo ou use o atendimento informado no checkout.",
        ),
      );
  }, []);
  useEffect(() => {
    const open = (event: MouseEvent) => {
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href="#diagnostico"]')
          : null;
      if (
        !link ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      event.preventDefault();
      setMenuOpen(false);
      setFormOpen(true);
      track("start_qualification");
    };
    document.addEventListener("click", open);
    if (window.location.hash === "#diagnostico") setFormOpen(true);
    return () => document.removeEventListener("click", open);
  }, []);
  function preferences(value: boolean) {
    setAnalytics(value);
    try {
      localStorage.setItem("auren:analytics", value ? "yes" : "no");
    } catch {
      /* Privacy choice still applies in memory. */
    }
    setModal(null);
  }
  return (
    <>
      <a className="skip-link" href="#conteudo">
        Ir para o conteúdo
      </a>
      <header className="header">
        <div className="container header-inner">
          <Logo />
          <nav
            className={menuOpen ? "nav open" : "nav"}
            aria-label="Navegação principal"
          >
            {nav.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
          </nav>
          <PrimaryButton section="cabecalho" className="header-cta">
            <span className="header-cta-label">Quero meu diagnóstico</span>
            <span className="header-cta-mobile-label">Meu diagnóstico</span>
          </PrimaryButton>
          <button
            className="menu-toggle icon-button"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        <div
          id="mobile-nav"
          className={`mobile-nav ${menuOpen ? "open" : ""}`}
          hidden={!menuOpen}
        >
          {nav.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
              <ArrowUpRight size={16} />
            </a>
          ))}
        </div>
      </header>
      {paymentNotice && (
        <div className="payment-notice" role="status">
          <p>{paymentNotice}</p>
          <a
            id="post-purchase-whatsapp"
            hidden
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar sobre meu pedido <ArrowUpRight size={16} />
          </a>
        </div>
      )}
      <main id="conteudo">
        <Hero />
        <ProblemAwareness />
        <PainPoints />
        <Solution />
        <FounderSection />
        <ProcessTimeline />
        <Differentiators />
        <PricingOffer config={config} onTerms={() => setModal("terms")} />
        <TrustSection />
        <EducationalContent />
        <section id="diagnostico" className="container quick-diagnosis">
          <h2>Seu diagnóstico começa aqui.</h2>
          <PrimaryButton>Preencher meus dados</PrimaryButton>
        </section>
        <FAQAccordion />
        <ConversionSection />
      </main>
      {formOpen && (
        <Dialog
          title="Garantir meu diagnóstico financeiro"
          onClose={() => setFormOpen(false)}
        >
          <QualificationForm
            config={config}
            onPrivacy={() => setModal("privacy")}
            onTerms={() => setModal("terms")}
          />
        </Dialog>
      )}
      <footer className="footer">
        <div className="container">
          <div className="footer-top">
            <div>
              <Logo />
              <p>
                Orientação e estratégia <br />
                para decidir melhor.
              </p>
            </div>
            <div className="footer-links">
              <a href="#como-funciona">Como funciona</a>
              <a href="#sobre">Sobre Vandilton</a>
              <button onClick={() => setModal("contact")}>
                Fale com a Auren <ArrowUpRight size={13} />
              </button>
            </div>
            <div className="footer-links">
              <button onClick={() => setModal("privacy")}>
                Informação de privacidade
              </button>
              <button onClick={() => setModal("terms")}>
                Condições do serviço
              </button>
              <button onClick={() => setModal("preferences")}>
                Preferências de privacidade
              </button>
            </div>
          </div>
          <p className="footer-disclaimer">
            A Auren Capital oferece consultoria e orientação financeira, sem
            garantir aprovação ou liberação de crédito pelas instituições
            financeiras.
          </p>
          <div className="footer-bottom">
            <span>© 2026 Auren Capital. Todos os direitos reservados.</span>
            <div className="footer-developer">
              <span>Desenvolvido pela DGS Marketing &amp; Growh</span>
              <img
                src="/logo-dgs.svg"
                alt="DGS Marketing & Growth"
                width="153"
                height="40"
                loading="lazy"
              />
            </div>
          </div>
          {brand.legalName && (
            <p className="footer-legal">
              {brand.legalName} · CNPJ {brand.cnpj}
            </p>
          )}
        </div>
      </footer>
      {modal && (
        <Dialog
          title={
            {
              privacy: "Informação de privacidade",
              terms: "Condições do diagnóstico",
              preferences: "Preferências de privacidade",
              contact: "Atendimento Auren Capital",
            }[modal]
          }
          onClose={() => setModal(null)}
        >
          {modal === "privacy" && (
            <>
              {config.privacyNotice ? (
                <p className="pre-line">{config.privacyNotice}</p>
              ) : (
                <>
                  <p className="dialog-notice">
                    Política em validação, sujeita à confirmação dos dados
                    legais e canais oficiais da Auren Capital.
                  </p>
                  <h3>Sobre esta prévia</h3>
                  <p>
                    As respostas ficam apenas nesta página, sem envio, gravação
                    ou compartilhamento. São descartadas ao fechar ou
                    recarregar.
                  </p>
                  <h3>Antes de contratar</h3>
                  <p>
                    Antes de habilitar o envio, a Auren informará controlador,
                    finalidade, base legal, retenção, operadores e canal para
                    exercer seus direitos na LGPD. O formulário não solicita
                    documentos ou dados bancários.
                  </p>
                </>
              )}
              <h3>Medição e preferências</h3>
              <p>
                Medição opcional e desativada por padrão, sem nomes, contatos ou
                respostas financeiras. Não há pixels de publicidade instalados.
              </p>
              <button
                className="button button-outline"
                onClick={() => setModal("preferences")}
              >
                Gerenciar preferências
              </button>
            </>
          )}
          {modal === "terms" && (
            <>
              <p className="dialog-notice">
                {config.available
                  ? "Confira as condições antes de contratar."
                  : "Contratação em preparação, sem cobranças."}
              </p>
              <h3>Diagnóstico Financeiro Empresarial</h3>
              <p>
                Avaliação financeira e de crédito com orientação inicial,
                baseada em dados disponíveis e consultas autorizadas.
              </p>
              <ul>
                <li>Coleta inicial estruturada.</li>
                <li>Avaliação no escopo contratado.</li>
                <li>Pontos de atenção e orientação inicial.</li>
                <li>Possíveis próximos passos.</li>
              </ul>
              <p>
                Não é empréstimo nem garante crédito. Consultorias adicionais
                são opcionais.
              </p>
              {config.conditions ? (
                <p className="pre-line">{config.conditions}</p>
              ) : (
                <>
                  <h3>Antes de contratar</h3>
                  <p>
                    A Auren precisa confirmar valor, entregáveis, prazos,
                    atendimento, cancelamento e reembolso. As condições serão
                    informadas antes do pagamento.
                  </p>
                </>
              )}
            </>
          )}
          {modal === "preferences" && (
            <>
              <p>
                Recursos essenciais mantêm a página e o questionário. Apenas sua
                preferência é salva no navegador.
              </p>
              <div className="preference-row">
                <div>
                  <h3>Recursos essenciais</h3>
                  <p>Necessários para a página.</p>
                </div>
                <span>Sempre ativos</span>
              </div>
              <div className="preference-row">
                <div>
                  <h3>Medição de navegação</h3>
                  <p>Eventos opcionais, sem respostas ou contatos.</p>
                </div>
                <label className="toggle">
                  <input
                    aria-label="Permitir medição de navegação"
                    type="checkbox"
                    checked={preferenceDraft}
                    onChange={(e) => setPreferenceDraft(e.target.checked)}
                  />
                  <span />
                </label>
              </div>
              <div className="dialog-actions">
                <button
                  className="button button-outline"
                  onClick={() => preferences(false)}
                >
                  Somente essenciais
                </button>
                <button
                  className="button button-primary"
                  onClick={() => preferences(preferenceDraft)}
                >
                  Salvar preferências
                </button>
              </div>
            </>
          )}
          {modal === "contact" && (
            <>
              {brand.supportEmail ? (
                <>
                  <p>Tire dúvidas com a equipe pelo canal oficial.</p>
                  <a
                    className="button button-primary"
                    href={`mailto:${brand.supportEmail}`}
                  >
                    {brand.supportEmail}
                  </a>
                </>
              ) : (
                <>
                  <p className="dialog-notice">
                    O canal de atendimento será publicado após validação da
                    Auren Capital.
                  </p>
                  <p>
                    Conheça o serviço e explore o questionário, sem cobranças.
                  </p>
                  <button
                    className="button button-primary"
                    onClick={() => {
                      setModal(null);
                      document
                        .getElementById("duvidas")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Ver dúvidas frequentes
                  </button>
                </>
              )}
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
