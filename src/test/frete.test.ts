import { afterEach, describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { quoteOrder } from "@/lib/order-pricing";
import { itemsTotalCents } from "@/lib/gateway-items";
import { applyStore, DEFAULT_STORE, priceOf, store } from "@/lib/store-settings";

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
    applyStore({ ...DEFAULT_STORE, discountPct: 0, freeShippingMin: 0 });
    const q = quoteOrder(
      [
        { id: sandalia.id, tamanho: "37", qtd: 1 },
        { id: sandalia.id, tamanho: "37", qtd: 1 },
      ],
      "padrao",
    );
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]!.qtd).toBe(2);
    expect(q.totalCents).toBe(
      Math.round(sandalia.preco * 100) * 2 + Math.round(store.shipping.padrao.price * 100),
    );
    expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
    expect(q.gatewayItems[0]!.title).toContain(`Ref. ${sandalia.ref}`);
    expect(q.gatewayItems[0]!.title).toContain("tam. 37");
    expect(q.gatewayItems.at(-1)).toMatchObject({ title: "Frete Padrão", tangible: false });
  });

  it("frete grátis só a partir do mínimo configurado", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 0, freeShippingMin: 1_000_000 });
    expect(() => quoteOrder([{ id: sandalia.id, tamanho: "37", qtd: 1 }], "gratis")).toThrow(
      "frete",
    );
    applyStore({ ...DEFAULT_STORE, discountPct: 0, freeShippingMin: 1 });
    const q = quoteOrder([{ id: sandalia.id, tamanho: "37", qtd: 1 }], "gratis");
    expect(q.frete.price).toBe(0);
    expect(q.gatewayItems).toHaveLength(1);
  });

  it("recusa produto inexistente, tamanho fora da grade e sacola vazia", () => {
    expect(() => quoteOrder([{ id: "nao-existe", tamanho: "37", qtd: 1 }], "padrao")).toThrow();
    expect(() => quoteOrder([{ id: sandalia.id, tamanho: "99", qtd: 1 }], "padrao")).toThrow(
      "tamanho",
    );
    expect(() => quoteOrder([], "padrao")).toThrow("vazia");
  });
});
