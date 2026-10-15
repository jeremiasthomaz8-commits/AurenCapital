# Contrato do adaptador de pagamentos

O cliente ainda não selecionou um provedor brasileiro. A aplicação exige um adaptador privado que traduza este contrato para o SDK/API oficial do provedor escolhido. Este contrato não simula um pagamento e não substitui a integração específica.

## Checkout hospedado

`POST {PAYMENT_BRIDGE_URL}/checkouts`

Autenticação: `Authorization: Bearer {PAYMENT_BRIDGE_TOKEN}`. A chave `Idempotency-Key` contém a referência Auren e deve ser respeitada pelo adaptador/provedor.

```json
{
  "orderId": "referência Auren gerada no servidor",
  "amountCents": 0,
  "currency": "BRL",
  "description": "Diagnóstico Financeiro Empresarial",
  "returnUrl": "https://dominio-oficial/?order=token-aleatorio",
  "customer": { "name": "...", "email": "...", "phone": "..." }
}
```

`amountCents` é o valor aprovado, sempre positivo, determinado pelo servidor. O zero acima é somente indicação de tipo, nunca valor operacional. Não transportar cartão ou documentos neste contrato.

Resposta esperada:

```json
{
  "reference": "referencia-do-provedor",
  "url": "https://dominio-autorizado-do-checkout/..."
}
```

O backend aceita apenas HTTPS e domínio exatamente presente em `CHECKOUT_ALLOWED_HOSTS`. Redirecionamentos no acesso ao adaptador são rejeitados para evitar vazamento do token.

## Confirmação autenticada

`GET {PAYMENT_BRIDGE_URL}/payments/{reference}`

Mesma autenticação. Consultar a API oficial do provedor e normalizar:

```json
{
  "reference": "referencia-do-provedor",
  "status": "paid",
  "amountCents": 0,
  "currency": "BRL"
}
```

Status aceitos: `pending`, `paid`, `canceled`, `failed`. PIX gerado e cartão em análise são `pending`, nunca `paid`.

## Webhook

O adaptador deve validar a autenticação oficial do webhook do provedor, normalizar o evento e enviá-lo a `POST /api/payments/webhook`:

```json
{
  "id": "id-unico-do-evento",
  "reference": "referencia-do-provedor",
  "status": "paid",
  "amountCents": 0,
  "currency": "BRL"
}
```

Headers:

- `X-Auren-Timestamp`: Unix timestamp em milissegundos, 13 dígitos.
- `X-Auren-Signature`: HMAC-SHA256 hexadecimal de `timestamp + "." + corpo bruto`, assinado com `WEBHOOK_SECRET`.
- `Content-Type: application/json`.

A Auren ainda consulta o pagamento no adaptador antes de aceitar o evento. O ID é único no banco e eventos repetidos não produzem outra transição. Divergência de valor ou moeda é rejeitada. O adaptador deve tratar reembolsos e chargebacks por fluxo operacional específico; esses eventos não estão habilitados por padrão e não devem ser convertidos artificialmente em `failed`.

## Operação e acesso

Armazenar o SQLite em disco persistente fora de `dist/`, com chave AES em gerenciador de segredos, backups cifrados e acesso apenas a operadores autorizados. Configurar retenção aprovada. Em Windows, aplicar ACLs do diretório; o parâmetro POSIX `mode` não garante permissões de Windows. A equipe deve ter um fluxo autenticado separado para ler leads e registrar andamento. O token aleatório do pedido é um segredo de acompanhamento e não deve ser enviado a plataformas de medição; a página usa `Referrer-Policy: no-referrer`.

Para escalar além de uma instância, migrar o repositório para um banco transacional compartilhado, colocar os limites de tráfego no gateway e preservar as restrições únicas. O limitador em memória atual serve uma instância; não constitui proteção distribuída. Configurar IP real apenas para proxies explicitamente confiáveis.

## Verificação antes da ativação

Validar envio duplicado, retry após indisponibilidade, preço divergente, assinatura incorreta, webhook atrasado, checkout cancelado, PIX pendente, pagamento confirmado, retorno falsificado e contato pós-compra. Só então habilitar `CONTRACTING_ENABLED=true` com todos os campos de `.env.example` preenchidos e aprovados.
