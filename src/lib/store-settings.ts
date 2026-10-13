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
  /** Ativado no painel: oculta todas as logos da loja, inclusive no checkout. */
  hideLogos: z.boolean().default(false),
  /** Desconto aplicado em toda a loja (%). 0 = sem desconto. */
  discountPct: z.number().int().min(0).max(90),
  shipping: z.object({
    /** Frete Padrão: grátis a partir de `freeFrom` (produtos, já com desconto); abaixo, custa `price`. */
    padrao: z.object({
      eta: z.string().trim().min(1).max(60),
      price: money.default(14.9),
      /** 0 = frete grátis em qualquer pedido. */
      freeFrom: money.default(0),
    }),
    /** Frete pago intermediário: mais rápido que o grátis, mais barato que o Express. */
    rapido: z
      .object({ price: money, eta: z.string().trim().min(1).max(60) })
      .default({ price: 19.9, eta: "3 a 6 dias úteis" }),
    express: z.object({ price: money, eta: z.string().trim().min(1).max(60) }),
  }),
});

export type StoreConfig = z.infer<typeof storeConfigSchema>;

export const DEFAULT_STORE: StoreConfig = {
  hideLogos: false,
  discountPct: 50,
  shipping: {
    padrao: { eta: "5 a 8 dias úteis", price: 14.9, freeFrom: 0 },
    rapido: { price: 19.9, eta: "3 a 6 dias úteis" },
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

export type FreteId = "gratis" | "padrao" | "rapido" | "express";
export type Frete = { id: FreteId; name: string; eta: string; price: number };

/** Pedido (produtos, já com desconto) que ganha frete grátis. */
export const hasFreeShipping = (subtotal: number) =>
  Math.round(subtotal * 100) >= Math.round(store.shipping.padrao.freeFrom * 100);

/** Quanto falta para o frete grátis (0 = já ganhou). */
export const missingForFreeShipping = (subtotal: number) =>
  Math.max(0, Math.round((store.shipping.padrao.freeFrom - subtotal) * 100) / 100);

/**
 * Opções de frete para o subtotal: Frete Grátis a partir do valor mínimo (abaixo, Frete Padrão
 * pago), ou Rápido e Express pagos para chegar antes. A primeira opção é sempre a padrão.
 */
export function fretes(subtotal: number): Frete[] {
  const { eta, price } = store.shipping.padrao;
  return [
    hasFreeShipping(subtotal)
      ? { id: "gratis", name: "Frete Grátis", eta, price: 0 }
      : { id: "padrao", name: "Frete Padrão", eta, price },
    {
      id: "rapido",
      name: "Frete Rápido",
      eta: store.shipping.rapido.eta,
      price: store.shipping.rapido.price,
    },
    {
      id: "express",
      name: "Frete Express",
      eta: store.shipping.express.eta,
      price: store.shipping.express.price,
    },
  ];
}

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
