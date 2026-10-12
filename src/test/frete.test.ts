import { afterEach, describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { quoteOrder } from "@/lib/order-pricing";
import { itemsTotalCents } from "@/lib/gateway-items";
import { applyStore, DEFAULT_STORE, priceOf, store } from "@/lib/store-settings";
import { ORDER_BUMPS } from "@/lib/order-bumps";

const sandalia = PRODUCTS.find((p) => p.tamanhos.includes("37"))!;

describe("pedido da sacola", () => {
  afterEach(() => applyStore(null));

  it("aplica o desconto geral do painel sobre o preço de tabela", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 50 });
    const { price, compareAt, off } = priceOf(sandalia);
    expect(price).toBe(Math.round(sandalia.preco * 50) / 100);
    expect(compareAt).toBe(sandalia.preco);
    expect(off).toBe(50);
    applyStore({ ...DEFAULT_STORE, discountPct: 0 });
    expect(priceOf(sandalia)).toEqual({ price: sandalia.preco, compareAt: null, off: 0 });
  });

  it("soma os itens, junta linhas repetidas e manda os nomes reais ao gateway", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 0 });
    const q = quoteOrder(
      [
        { id: sandalia.id, tamanho: "37", qtd: 1 },
        { id: sandalia.id, tamanho: "37", qtd: 1 },
      ],
      "express",
    );
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]!.qtd).toBe(2);
    expect(q.totalCents).toBe(
      Math.round(sandalia.preco * 100) * 2 + Math.round(store.shipping.express.price * 100),
    );
    expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
    expect(q.gatewayItems[0]!.title).toContain(`Ref. ${sandalia.ref}`);
    expect(q.gatewayItems[0]!.title).toContain("tam. 37");
    expect(q.gatewayItems.at(-1)).toMatchObject({ title: "Frete Express", tangible: false });
  });

  it("frete grátis a partir do valor mínimo; abaixo dele cobra o Frete Padrão", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 0 });
    const barato = PRODUCTS.find((p) => p.preco < 100 && p.tamanhos.includes("37"))!;
    const caro = PRODUCTS.find((p) => p.preco >= 100 && p.tamanhos.includes("37"))!;

    // Abaixo de R$ 100: "gratis" ou "padrao" viram o Frete Padrão pago, que vai ao gateway.
    for (const id of ["gratis", "padrao"] as const) {
      const q = quoteOrder([{ id: barato.id, tamanho: "37", qtd: 1 }], id);
      expect(q.frete).toMatchObject({ id: "padrao", price: 14.9 });
      expect(q.totalCents).toBe(Math.round(barato.preco * 100) + 1490);
      expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
      expect(q.gatewayItems.at(-1)).toMatchObject({ title: "Frete Padrão", tangible: false });
    }

    // A partir de R$ 100 (inclusive a soma de itens baratos): grátis.
    const q = quoteOrder([{ id: caro.id, tamanho: "37", qtd: 1 }], "padrao");
    expect(q.frete).toMatchObject({ id: "gratis", price: 0 });
    expect(q.gatewayItems).toHaveLength(1);
    const qtd = Math.ceil(100 / barato.preco);
    expect(quoteOrder([{ id: barato.id, tamanho: "37", qtd }], "gratis").frete.price).toBe(0);
  });

  it("configuração salva antes do frete mínimo continua válida, com R$ 100 e R$ 14,90", () => {
    applyStore({
      discountPct: 30,
      shipping: { padrao: { eta: "5 a 8 dias úteis" }, express: { price: 34.9, eta: "2 a 4 dias úteis" } },
    });
    expect(store.discountPct).toBe(30);
    expect(store.shipping.padrao).toMatchObject({ price: 14.9, freeFrom: 100 });
  });

  it("frete mínimo 0 deixa o frete grátis em todo pedido", () => {
    applyStore({ ...DEFAULT_STORE, shipping: { ...DEFAULT_STORE.shipping, padrao: { ...DEFAULT_STORE.shipping.padrao, freeFrom: 0 } } });
    const barato = PRODUCTS.find((p) => p.tamanhos.includes("37"))!;
    expect(quoteOrder([{ id: barato.id, tamanho: "37", qtd: 1 }], "gratis").frete.price).toBe(0);
  });

  it("recusa produto inexistente, tamanho fora da grade e sacola vazia", () => {
    expect(() => quoteOrder([{ id: "nao-existe", tamanho: "37", qtd: 1 }], "gratis")).toThrow();
    expect(() => quoteOrder([{ id: sandalia.id, tamanho: "99", qtd: 1 }], "gratis")).toThrow(
      "tamanho",
    );
    expect(() => quoteOrder([], "gratis")).toThrow("vazia");
  });

  it("order bump cobra o preço da oferta, 1 unidade, só para produtos configurados", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 50 });
    const bump = ORDER_BUMPS.find((b) => b.discountPct === 30)!;
    const p = PRODUCTS.find((x) => x.id === bump.productId)!;
    const q = quoteOrder(
      [
        { id: sandalia.id, tamanho: "37", qtd: 1 },
        { id: p.id, tamanho: p.tamanhos[0]!, qtd: 1, bump: true },
      ],
      "gratis",
    );
    const oferta = q.lines.find((l) => l.bump)!;
    expect(oferta.unit).toBe(Math.round(priceOf(p).price * 70) / 100);
    expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
    expect(() =>
      quoteOrder([{ id: p.id, tamanho: p.tamanhos[0]!, qtd: 2, bump: true }], "gratis"),
    ).toThrow("oferta");
    const fora = PRODUCTS.find((x) => !ORDER_BUMPS.some((b) => b.productId === x.id))!;
    expect(() =>
      quoteOrder([{ id: fora.id, tamanho: fora.tamanhos[0]!, qtd: 1, bump: true }], "gratis"),
    ).toThrow("oferta");
  });
});
