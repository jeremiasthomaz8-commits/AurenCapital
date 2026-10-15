# Verificação da entrega — 15/10/2026

Atualização: foto fornecida pelo cliente inserida nos dois espaços de Vandilton. Arquivo PNG original com transparência preservado; enquadramento de desktop e celular feito por CSS. Foto também incorporada à apresentação independente.

Atualização da biografia: a seção sobre Vandilton passa a usar `public/vandilton-santos-sobre.png`, com o fundo original da nova foto enviada. A abertura conserva a foto com transparência.

Atualização de marca: SVG oficial inserido no cabeçalho e no rodapé, com proporção preservada e dimensões responsivas. O símbolo do mesmo SVG foi aplicado ao favicon. Os logos também estão incorporados à apresentação independente.

Atualização de conteúdo: textos de apresentação, títulos, CTAs, formulário, FAQ, rodapé e modais resumidos. Mantidos experiência de Vandilton, finalidade do diagnóstico, caráter pago, contratação separada de consultorias, limites da análise, consentimentos e avisos de privacidade. As opções do questionário e as regras de contratação foram preservadas.

## Concluído

- Compilação TypeScript e build Vite concluídos sem erros.
- Sete testes aprovados: validação de dados e consentimentos; criptografia autenticada; envio idempotente; transições de pagamento e valor correto; assinatura de webhook; domínio do checkout; questionário completo em ambiente DOM de teste.
- O teste do questionário verifica campos vazios, aviso para empresa sem CNPJ ativo, etapas, e-mail inválido, máscara de WhatsApp, revisão, preservação ao voltar, ausência de envio e ausência de gravação de respostas no navegador.
- Apresentação independente verificada: português, H1 único, 13 seções de conteúdo mais cabeçalho e rodapé, âncoras resolvidas, CSS/fontes incorporados e sintaxe do JavaScript válida.
- Resposta HTTP 200 da prévia local.
- API de apresentação retorna contratação desativada e preço nulo.
- Nenhum retrato, depoimento, dado cadastral ou pagamento fictício usado como real.

## Limites da verificação

- A ferramenta de navegador bloqueou a inspeção por política de acesso. A conferência visual em navegador, os tamanhos de viewport e o Lighthouse não foram verificados. O CSS contempla desktop, tablet e telas de até 320 px, mas isso não equivale a validação visual concluída.
- O registro de hospedagem no Sites retornou erro interno. A listagem posterior não apresentou o projeto Auren Capital. Não há publicação online confirmada.
- A integração com um provedor de pagamento real não foi executada porque o provedor e suas credenciais não foram fornecidos. O contrato do adaptador, os bloqueios e as regras críticas foram implementados e testados localmente.
- O armazenamento de leads permanece desativado na apresentação. Só pode ser habilitado com condições comerciais, identidade do controlador, retenção, segredos e provedor configurados.

## Entregáveis

- `apresentacao.html`: apresentação independente e interativa.
- `src/`: frontend React e TypeScript.
- `server/`: API Node, repositório cifrado e regras de confirmação.
- `README.md`: execução e pendências de produção.
- `INTEGRATIONS.md`: contrato e requisitos do adaptador de pagamento.
- `DESIGN.md`: direção de arte e organização visual.

O servidor temporário de revisão é encerrado ao concluir a entrega. A apresentação HTML não depende dele. Para retomar a prévia de desenvolvimento, executar `npm run dev`.
