import { Plus, Minus } from "lucide-react";
import { Eyebrow } from "./ui";
import { track } from "../analytics";

const questions = [
  [
    "O diagnóstico é gratuito?",
    "Não. É um serviço pago, com valor e condições informados antes da contratação.",
  ],
  [
    "A Auren garante aprovação de crédito?",
    "Não. A decisão cabe à instituição financeira, conforme sua análise e seus critérios. A Auren oferece avaliação e orientação.",
  ],
  [
    "Para quem é indicado?",
    "Para empresários que querem entender sua situação financeira e de crédito, superar dúvidas e planejar os próximos passos.",
  ],
  [
    "O que acontece após o pagamento?",
    "Após a confirmação, a equipe informa os dados necessários e as próximas etapas, conforme contratado.",
  ],
  [
    "Inclui a consultoria completa?",
    "É uma avaliação inicial. Outras soluções têm objetivos, escopo e valores apresentados à parte, sem obrigação de contratar.",
  ],
  [
    "Quais dados preciso enviar?",
    "A equipe informa os dados necessários, sua finalidade e as autorizações aplicáveis. Não envie documentos, senhas ou dados bancários neste formulário.",
  ],
  [
    "Qual é o prazo do diagnóstico?",
    "Os prazos são informados nas condições do serviço, antes de contratar.",
  ],
];

export function FAQAccordion() {
  return (
    <section className="section faq-section" id="duvidas">
      <div className="container faq-grid">
        <div className="faq-heading">
          <Eyebrow>Respostas com transparência</Eyebrow>
          <h2>
            Suas dúvidas. <br />
            <span className="soft-color">Sem rodeios.</span>
          </h2>
          <p>Conheça o serviço antes de contratar.</p>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer], index) => (
            <details
              key={question}
              onToggle={(event) => {
                if (event.currentTarget.open)
                  track("expand_faq", { question: index + 1 });
              }}
            >
              <summary>
                {question}
                <span className="faq-plus">
                  <Plus size={18} />
                </span>
                <span className="faq-minus">
                  <Minus size={18} />
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
