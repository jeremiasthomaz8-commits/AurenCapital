# Auren Capital — landing page

Experiência completa em português, com React, TypeScript, Vite e Sora auto-hospedada. As 15 seções do briefing estão implementadas, com navegação por âncoras, questionário de quatro etapas, revisão das respostas, FAQ acessível, modais de condições e preferências de privacidade.

O arquivo `apresentacao.html` é uma apresentação independente: pode ser aberto diretamente no navegador, com fontes, estilos e interações incorporados. Não depende de instalar Node ou iniciar servidor, e não habilita contratação.

## Executar

Requer Node.js 24 ou superior.

```powershell
npm install
npm run dev
```

Abrir `http://127.0.0.1:5173`. O comando inicia o frontend e a API local na porta 8787. Para a versão compilada:

```powershell
npm run build
npm start
```

Abrir `http://127.0.0.1:8787`. `npm test` executa a verificação da validação, criptografia, idempotência, confirmação de pagamento e restrição de domínio do checkout. O build gera HTML inicial renderizado, além de hidratação React, para oferecer conteúdo antes da execução do JavaScript.

## Estado atual

Modo de apresentação explícito: o questionário funciona até a revisão, mas não envia dados nem faz cobranças. As respostas ficam apenas na memória da página. Ao recarregar, são descartadas. O servidor recusa a coleta com HTTP 503 enquanto a contratação não estiver configurada. A preferência de medição é o único valor que pode ser salvo no navegador.

O valor de R$ 89 existe apenas como rascunho em `business.json`. Não é exibido como preço aprovado, enviado ao checkout ou incluído em dados estruturados. O frontend consulta `/api/config` para obter o valor comercial aprovado pelo servidor; a cobrança usa o mesmo valor em centavos. Nunca configure valores de pagamento no navegador.

## Materiais e decisões pendentes

| Material / decisão                    | Onde configurar                                             |
| ------------------------------------- | ----------------------------------------------------------- |
| Logo oficial SVG recebido e inserido  | `public/logo-auren.svg`, usado no cabeçalho e no rodapé     |
| Foto de Vandilton recebida e inserida | `public/vandilton-santos.png`, usada no hero e na biografia |
| Razão social, CNPJ e contato oficial  | `src/config.ts` e variáveis do servidor                     |
| Preço e entregáveis aprovados         | `APPROVED_PRICE_CENTS`, `SERVICE_CONDITIONS`                |
| Prazos, cancelamento e reembolso      | `SERVICE_CONDITIONS` e condições definitivas                |
| Política de privacidade validada      | `PRIVACY_NOTICE`, `LEGAL_VERSION`, `RETENTION_DAYS`         |
| Provedor de pagamento escolhido       | Implementar o adaptador descrito em `INTEGRATIONS.md`       |
| Credenciais do provedor e segredos    | Gerenciador de segredos do host; ver `.env.example`         |
| Canal de pós-venda                    | `SUPPORT_WHATSAPP`, somente após pagamento confirmado       |

A foto fornecida pelo cliente foi inserida no hero e na biografia, com enquadramento responsivo por CSS e preservação do arquivo original e de sua transparência. O SVG oficial fornecido pelo cliente é usado no cabeçalho e no rodapé, com seu símbolo aplicado ao favicon. Não há depoimentos, números de resultados, empregadores ou certificações inventados. A revisão das condições comerciais continua necessária antes da abertura da contratação.

## Servidor e armazenamento

O servidor Node implementa armazenamento SQLite persistente, com payload pessoal cifrado por AES-256-GCM, consentimento com data e versão, chave de idempotência, token aleatório de acompanhamento e eventos de pagamento idempotentes. A chave é obrigatória e permanece fora do banco e do repositório. O banco e backups precisam de disco persistente, permissões restritas e gestão própria de acesso. Não há endpoint público para listar ou ler leads. Não publicar `data/`, `.env` ou os arquivos de backup.

O ciclo persistido começa em `qualified`, após envio válido. `started` é um evento de navegação opcional, sem dados pessoais. Os estados seguintes são `checkout_pending → paid → onboarding → completed`, com `canceled` e `failed` para pagamentos não concluídos. O retorno do navegador nunca altera o pedido para pago. A equipe deve conduzir a avaliação e atualizar os estados operacionais por ferramenta administrativa autenticada, que fica fora do escopo desta landing page.

O webhook exige assinatura, janela de tempo, valor e moeda corretos e consulta autenticada ao adaptador do provedor. O registro pago não regride por eventos pendentes atrasados. A orientação pós-compra contém a referência real do pedido. Não é necessário fornecer dados de cartão à aplicação.

## Publicação

Esta implementação funciona de ponta a ponta em um host Node 24 com HTTPS, disco persistente e o adaptador do provedor. `HOST=0.0.0.0` pode ser configurado no host; usar proxy TLS e restringir acesso administrativo.

`dist/` também pode ser hospedado como apresentação estática. Nesse caso o backend Node **não** é executado pela hospedagem estática, e a contratação permanece desativada. Para conectar uma API separada, configurar `VITE_API_BASE_URL` no build e CORS com a origem exata no servidor, além de ajustar a CSP do host.

A tentativa de registro no Sites em 15/10/2026 retornou erro interno, e a listagem posterior não mostrou projeto Auren Capital. Nenhum projeto duplicado foi criado, nenhum ID foi inventado e não há publicação confirmada. O código e a prévia local permanecem disponíveis.

Antes da publicação comercial: substituir placeholders, revisar todos os dados legais, habilitar contratação somente com condições aprovadas, testar o provedor em sandbox, configurar o domínio canônico e Open Graph absolutos, exportar `social-cover.svg` em PNG/JPEG para compatibilidade social e remover `noindex` e o bloqueio de `robots.txt` somente após aprovação da versão comercial. Acrescentar dados estruturados apenas com informações validadas.

## Arquitetura

- `src/components/LandingSections.tsx`: conteúdo editorial e todas as seções de apresentação.
- `src/components/QualificationForm.tsx`: etapas, validação, revisão e envio.
- `src/components/FAQAccordion.tsx`: perguntas e respostas com `details/summary` nativo.
- `src/components/Dialog.tsx`: modal nativo, foco e fechamento por Escape.
- `src/config.ts` e `business.json`: configuração de marca e produto.
- `src/analytics.ts`: consentimento e eventos sem dados pessoais.
- `server/core.mjs`: validação, criptografia, repositório e regras de pagamento.
- `server/index.mjs`: API, CORS, limites de requisição, headers e adaptador.
- `tests/core.test.mjs`: testes das regras críticas do funil.

## Medição

Nenhum GA4, GTM, Meta Pixel ou CAPI está instalado. A camada prepara eventos por `window` (`auren:analytics`) apenas com consentimento e uma lista restrita de propriedades. As UTMs só acompanham o envio quando a medição foi autorizada; valores são limitados e validados. Integrações futuras não podem enviar nome, WhatsApp, e-mail ou respostas financeiras a plataformas de anúncio. `purchase_confirmed` deve ser emitido no servidor com base no webhook confirmado e no consentimento aplicável, nunca pelo clique ou pela URL de retorno.
