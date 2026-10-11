/**
 * Configurações da loja editáveis no /admin → Loja: desconto geral e frete.
 * Os valores abaixo são o padrão; o que estiver salvo no banco (site_settings "store") substitui.
 * O servidor recarrega do banco antes de cada cobrança (store-settings.server.ts), então o valor
 * cobrado é sempre o do painel. O navegador recebe as mesmas regras pelo loader da raiz só para exibir.
 */
import { z } from "zod";
import type { Produto } from "@/lib/catalog";

export const STORE_SETTING_KEY = "store";

const money = z.number().finite().min(0).max(100_000);

export const storeConfigSchema = z.object({
  /** Desconto aplicado em toda a loja (%). 0 = sem desconto. */
  discountPct: z.number().int().min(0).max(90),
  shipping: z.object({
    /** Frete grátis, para todos os pedidos: só o prazo é configurável. */
    padrao: z.object({ eta: z.string().trim().min(1).max(60) }),
    express: z.object({ price: money, eta: z.string().trim().min(1).max(60) }),
  }),
});

export type StoreConfig = z.infer<typeof storeConfigSchema>;

export const DEFAULT_STORE: StoreConfig = {
  discountPct: 50,
  shipping: {
    padrao: { eta: "5 a 8 dias úteis" },
    express: { price: 34.9, eta: "2 a 4 dias úteis" },
  },
};

/** Configuração em uso agora (o que a loja exibe e o servidor cobra). */
export const store: StoreConfig = structuredClone(DEFAULT_STORE);

/** Aplica a configuração. Sem configuração válida, volta ao padrão. Idempotente. */
export function applyStore(raw: unknown): StoreConfig {
  const parsed = storeConfigSchema.safeParse(raw);
  Object.assign(store, structuredClone(parsed.success ? parsed.data : DEFAULT_STORE));
  return store;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Preço de venda e preço "de" de um produto, com o desconto geral aplicado. */
export function priceOf(p: Produto): { price: number; compareAt: number | null; off: number } {
  const base = p.precoAntigo && p.precoAntigo > p.preco ? p.precoAntigo : p.preco;
  const price = store.discountPct > 0 ? round(base * (1 - store.discountPct / 100)) : p.preco;
  const compareAt = price < base ? base : null;
  return { price, compareAt, off: compareAt ? Math.round((1 - price / compareAt) * 100) : 0 };
}

export type FreteId = "gratis" | "padrao" | "express";
export type Frete = { id: FreteId; name: string; eta: string; price: number };

/** Opções de frete: grátis em todo pedido, ou Express pago para chegar mais rápido. */
export function fretes(): Frete[] {
  return [
    { id: "gratis", name: "Frete Grátis", eta: store.shipping.padrao.eta, price: 0 },
    { id: "express", name: "Frete Express", eta: store.shipping.express.eta, price: store.shipping.express.price },
  ];
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
