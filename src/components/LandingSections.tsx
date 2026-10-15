import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CircleCheck,
  Compass,
  FileSearch,
  Fingerprint,
  Handshake,
  Layers3,
  Landmark,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Wallet,
} from "lucide-react";
import { type ServiceConfig, money } from "../config";
import { CheckItem, Eyebrow, Portrait, PrimaryButton } from "./ui";

export function Hero() {
  return (
    <section className="hero" id="inicio" aria-labelledby="hero-title">
      <div className="hero-grid container">
        <div className="hero-copy">
          <Eyebrow>Crédito empresarial com estratégia</Eyebrow>
          <h1 id="hero-title">
            Crédito <span className="headline-gradient">negado</span> para sua
            empresa?
          </h1>
          <p className="hero-intro">
            Entenda o que pode dificultar seu acesso ao crédito.
          </p>
          <p className="hero-description">
            Com quase 8 anos no setor bancário, Vandilton Santos ajuda a
            entender sua empresa e planejar os próximos passos.
          </p>
          <PrimaryButton section="hero">Analisar minha empresa</PrimaryButton>
          <p className="cta-caption">
            <LockKeyhole size={13} aria-hidden="true" /> Diagnóstico pago. Sem
            promessa de aprovação.
          </p>
          <div className="hero-trust">
            <span>
              <Landmark size={16} /> Experiência bancária
            </span>
            <span>
              <Fingerprint size={16} /> Análise individualizada
            </span>
          </div>
        </div>
        <Portrait />
      </div>
      <div className="hero-bottom container">
        <span>Informação para decidir melhor.</span>
        <a href="#cenario">
          Veja outra perspectiva <span aria-hidden="true">↓</span>
        </a>
      </div>
    </section>
  );
}

export function ProblemAwareness() {
  return (
    <section className="statement-section" id="cenario">
      <div className="statement container">
        <span className="statement-mark" aria-hidden="true">
          “
        </span>
        <h2>
          Crédito negado nem sempre <br />
          significa <span>falta de potencial.</span>
        </h2>
        <p>
          Sua empresa pode ter clientes, operação e potencial de crescimento,
          mas enfrentar dificuldades de crédito. Conhecer possíveis motivos
          ajuda a decidir melhor.
        </p>
      </div>
    </section>
  );
}

const pains = [
  {
    icon: Landmark,
    title: "Crédito negado",
    text: "O banco negou crédito e você não sabe o que pode ter influenciado a decisão.",
  },
  {
    icon: Wallet,
    title: "Falta de capital de giro",
    text: "Faltam recursos para manter a operação ou aproveitar oportunidades.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Limites insuficientes",
    text: "Os limites oferecidos não atendem às necessidades do negócio.",
  },
  {
    icon: Compass,
    title: "Falta de direção",
    text: "Você não sabe o que organizar antes de solicitar crédito novamente.",
  },
];

export function PainPoints() {
  return (
    <section className="section pain-section">
      <div className="container">
        <div className="section-heading">
          <Eyebrow>Desafios do empresário</Eyebrow>
          <h2>
            Sua empresa <br />
            vive alguma destas situações?
          </h2>
          <p>Antes de tentar de novo, entenda o cenário.</p>
        </div>
        <div className="pain-grid">
          {pains.map(({ icon: Icon, title, text }) => (
            <article className="pain-card" key={title}>
              <div className="icon-box">
                <Icon size={24} strokeWidth={1.5} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="card-corner" aria-hidden="true" />
            </article>
          ))}
        </div>
        <div className="center-action">
          <PrimaryButton section="situacoes">
            Entender meu cenário
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

const benefits = [
  {
    icon: ScanLine,
    title: "Compreender o cenário",
    text: "Organize os dados para entender a situação financeira da empresa.",
  },
  {
    icon: FileSearch,
    title: "Identificar obstáculos",
    text: "Avalie possíveis obstáculos com dados disponíveis e consultas autorizadas.",
  },
  {
    icon: Compass,
    title: "Definir próximos passos",
    text: "Receba orientação inicial sobre caminhos possíveis.",
  },
];

export function Solution() {
  return (
    <section className="section solution-section" id="o-diagnostico">
      <div className="container solution-grid">
        <div className="solution-copy">
          <Eyebrow>Diagnóstico Financeiro Auren</Eyebrow>
          <h2>
            Antes de buscar <br />
            mais crédito, <br />
            <span className="soft-color">busque clareza.</span>
          </h2>
          <p>
            Uma avaliação inicial da situação financeira e de crédito da
            empresa, com orientação para o seu momento.
          </p>
          <PrimaryButton section="solucao">Ver próximos passos</PrimaryButton>
          <p className="disclaimer">
            Não é oferta de empréstimo nem substitui a análise da instituição
            financeira.
          </p>
        </div>
        <div className="diagnostic-map">
          <div className="diagnostic-map-header">
            <span className="mini-brand">AUREN / DIAGNÓSTICO</span>
            <SlidersHorizontal size={18} />
          </div>
          {benefits.map(({ icon: Icon, title, text }, i) => (
            <article className="benefit-row" key={title}>
              <div className="benefit-icon">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
              {i < 2 && (
                <span className="benefit-connector" aria-hidden="true" />
              )}
            </article>
          ))}
          <div className="diagnostic-map-footer">
            <ShieldCheck size={16} />
            <span>Análise responsável e transparente.</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FounderSection() {
  return (
    <section className="founder-section" id="sobre">
      <div className="container founder-grid">
        <Portrait variant="founder" />
        <div className="founder-copy">
          <Eyebrow light>À frente da Auren Capital</Eyebrow>
          <h2>
            Vandilton <br />
            <span>Santos.</span>
          </h2>
          <p className="founder-lead">
            Enquanto o mercado promete, <br />
            <strong>Vandilton explica.</strong>
          </p>
          <p>
            Com quase oito anos em relacionamento bancário empresarial e
            operações de crédito, Vandilton ajuda empresários a compreender as
            análises financeiras.
          </p>
          <p>
            Na Auren Capital, traduz conhecimento técnico em orientação clara e
            responsável. Boas decisões começam com informação.
          </p>
          <div className="founder-credentials">
            <span>
              <Building2 size={19} />
              Experiência em crédito PJ
            </span>
            <span>
              <Handshake size={19} />
              Proximidade e transparência
            </span>
          </div>
          <PrimaryButton section="vandilton">
            Quero orientação empresarial
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    title: "Conte seu momento",
    text: "Conte sobre sua empresa e suas necessidades.",
  },
  {
    title: "Contrate o diagnóstico",
    text: "Confira escopo, valor e condições antes de pagar.",
  },
  {
    title: "Receba uma análise",
    text: "A análise começa após o pagamento confirmado e o recebimento dos dados necessários.",
  },
  {
    title: "Planeje os próximos passos",
    text: "Entenda a análise e os caminhos possíveis para sua empresa.",
  },
];

export function ProcessTimeline() {
  return (
    <section className="section process-section" id="como-funciona">
      <div className="container">
        <div className="section-heading">
          <Eyebrow>Clareza em cada etapa</Eyebrow>
          <h2>
            Entenda cada etapa. <br />
            Decida com confiança.
          </h2>
        </div>
        <ol className="process-grid">
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="step-number">
                0{i + 1}
                <span aria-hidden="true">.</span>
              </span>
              <div className="step-line" aria-hidden="true">
                <i />
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="process-note">
          <LockKeyhole size={15} />
          Atendimento personalizado após o pagamento confirmado.
        </p>
      </div>
    </section>
  );
}

export function Differentiators() {
  const items = [
    {
      icon: BriefcaseBusiness,
      title: "Experiência prática",
      text: "Conhecimento da prática bancária.",
    },
    {
      icon: Fingerprint,
      title: "Olhar individual",
      text: "Cada empresa tem seu contexto financeiro.",
    },
    {
      icon: ShieldCheck,
      title: "Transparência",
      text: "Serviço, etapas e limites bem explicados.",
    },
    {
      icon: Compass,
      title: "Direção estratégica",
      text: "Orientação para decidir com consciência.",
    },
  ];
  return (
    <section className="difference-section">
      <div className="container">
        <div className="difference-heading">
          <Eyebrow>A essência Auren</Eyebrow>
          <h2>
            Compreensão antes <br />
            de qualquer promessa.
          </h2>
        </div>
        <div className="difference-grid">
          {items.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={22} strokeWidth={1.5} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PricingOffer({
  config,
  onTerms,
}: {
  config: ServiceConfig;
  onTerms: () => void;
}) {
  return (
    <section className="section offer-section" id="investimento">
      <div className="container offer-grid">
        <div className="offer-copy">
          <Eyebrow>Seu primeiro passo</Eyebrow>
          <h2>
            Invista em clareza. <br />
            <span className="soft-color">Decida com estratégia.</span>
          </h2>
          <p>
            Uma avaliação inicial paga para entender seu cenário e orientar os
            próximos passos.
          </p>
          <div className="offer-quote">
            <span aria-hidden="true">“</span>
            <p>
              O início não é uma promessa de crédito. <br />
              <strong>É entender sua empresa.</strong>
            </p>
          </div>
          <div className="trust-pair">
            <span>
              <ShieldCheck size={20} />
              Condições antes do pagamento
            </span>
            <span>
              <Fingerprint size={20} />
              Avaliação individualizada
            </span>
          </div>
        </div>
        <article className="pricing-card">
          <div className="pricing-top">
            <span>SEU PONTO DE PARTIDA</span>
            <Layers3 size={23} />
          </div>
          <h3>
            Diagnóstico Financeiro <br />
            Empresarial
          </h3>
          <p className="pricing-description">Análise e orientação inicial.</p>
          <div className="price-area">
            {config.priceCents !== null ? (
              <>
                <span className="price">{money(config.priceCents)}</span>
                <span className="price-caption">Pagamento único</span>
              </>
            ) : (
              <>
                <span className="price pending-price">Valor a confirmar</span>
                <span className="price-caption">
                  Informado antes de contratar
                </span>
              </>
            )}
          </div>
          <ul className="pricing-inclusions">
            <CheckItem>Coleta inicial estruturada</CheckItem>
            <CheckItem>Avaliação no escopo contratado</CheckItem>
            <CheckItem>Pontos de atenção identificados</CheckItem>
            <CheckItem>Orientação inicial</CheckItem>
            <CheckItem>Possíveis próximos passos</CheckItem>
          </ul>
          <PrimaryButton section="oferta">Quero meu diagnóstico</PrimaryButton>
          <p className="price-disclaimer">
            Consultorias adicionais à parte. Sem garantia de aprovação de
            crédito.
          </p>
          <button className="text-button" onClick={onTerms}>
            Ver condições do serviço <ArrowUpRight size={13} />
          </button>
        </article>
      </div>
    </section>
  );
}

export function TrustSection() {
  return (
    <section className="trust-section">
      <div className="container trust-grid">
        <div>
          <Eyebrow light>Transparência em cada etapa</Eyebrow>
          <h2>
            Confiança começa <br />
            com clareza.
          </h2>
          <p>Entenda o serviço e o que ele pode oferecer.</p>
        </div>
        <div className="trust-principles">
          <article>
            <CircleCheck size={21} />
            <div>
              <h3>Sem promessas de aprovação</h3>
              <p>Crédito sujeito à análise e aos critérios da instituição.</p>
            </div>
          </article>
          <article>
            <LockKeyhole size={21} />
            <div>
              <h3>Dados necessários</h3>
              <p>Coleta limitada ao necessário para a avaliação.</p>
            </div>
          </article>
          <article>
            <FileSearch size={21} />
            <div>
              <h3>Escopo claro</h3>
              <p>Conheça valor, condições e prazos antes de pagar.</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function EducationalContent() {
  const items = [
    {
      icon: Landmark,
      title: "Histórico financeiro",
      text: "Histórico financeiro e relacionamento bancário podem compor a análise.",
    },
    {
      icon: ChartNoAxesCombined,
      title: "Capacidade de pagamento",
      text: "Receitas e compromissos ajudam a avaliar a capacidade de pagamento.",
    },
    {
      icon: Compass,
      title: "Perfil e finalidade",
      text: "Perfil da empresa, uso dos recursos e políticas do banco podem influenciar a análise.",
    },
  ];
  return (
    <section className="section education-section">
      <div className="container">
        <div className="education-heading">
          <div>
            <Eyebrow>Informação para decidir</Eyebrow>
            <h2>
              O que influencia <br />a análise de crédito?
            </h2>
          </div>
          <p>
            Cada empresa tem seu contexto. Conheça fatores que podem influenciar
            a avaliação.
          </p>
        </div>
        <div className="education-grid">
          {items.map(({ icon: Icon, title, text }) => (
            <article key={title}>
              <Icon size={26} strokeWidth={1.4} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <a className="inline-link" href="#diagnostico">
          Entender minha situação <ArrowUpRight size={17} />
        </a>
      </div>
    </section>
  );
}

export function ConversionSection() {
  return (
    <section className="conversion-section">
      <div className="conversion-arc" aria-hidden="true" />
      <div className="container conversion-content">
        <Eyebrow>Informação para decidir melhor</Eyebrow>
        <h2>
          Sua decisão <br />
          merece <span>mais clareza.</span>
        </h2>
        <p>
          Antes de buscar crédito novamente, entenda sua empresa. Comece com
          orientação.
        </p>
        <PrimaryButton section="final">Contratar meu diagnóstico</PrimaryButton>
        <p className="cta-caption">
          Serviço pago. Avaliação individualizada. Crédito sujeito à análise.
        </p>
      </div>
    </section>
  );
}
