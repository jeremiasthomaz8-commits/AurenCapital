import business from "../business.json";

export const brand = {
  ...business,
  logo: "/logo-auren.svg" as string | null,
  portraits: {
    hero: "/vandilton-santos.png" as string | null,
    founder: "/vandilton-santos-sobre.png" as string | null,
  },
  legalName: "Auren Capital Intermediação e Vendas Ltda." as string | null,
  cnpj: "61.834.530/0001-20" as string | null,
  supportEmail: null as string | null,
};

export interface ServiceConfig {
  available: boolean;
  priceCents: number | null;
  currency: string;
  serviceName: string;
  legalVersion: string;
  conditions: string | null;
  privacyNotice: string | null;
}
export const fallbackConfig: ServiceConfig = {
  available: false,
  priceCents: null,
  currency: business.currency,
  serviceName: business.serviceName,
  legalVersion: business.legalVersion,
  conditions: null,
  privacyNotice: null,
};
export const apiBase = (
  (import.meta as unknown as { env: Record<string, string> }).env
    .VITE_API_BASE_URL || ""
).replace(/\/$/, "");
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
