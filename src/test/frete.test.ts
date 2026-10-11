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

  it("frete grátis em qualquer pedido; o antigo Frete Padrão pago não existe mais", () => {
    expect(() => quoteOrder([{ id: sandalia.id, tamanho: "37", qtd: 1 }], "padrao")).toThrow(
      "frete",
    );
    const q = quoteOrder([{ id: sandalia.id, tamanho: "37", qtd: 1 }], "gratis");
    expect(q.frete.price).toBe(0);
    expect(q.gatewayItems).toHaveLength(1);
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
