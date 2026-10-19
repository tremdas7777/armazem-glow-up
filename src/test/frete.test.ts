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

  it("com valor mínimo no painel, frete grátis a partir dele; abaixo cobra o Frete Padrão", () => {
    applyStore({
      discountPct: 0,
      shipping: {
        ...DEFAULT_STORE.shipping,
        padrao: { ...DEFAULT_STORE.shipping.padrao, freeFrom: 100 },
      },
    });
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

  it("abaixo do mínimo com Frete Padrão a R$ 0: grátis travado, sobra só frete pago", () => {
    applyStore({
      discountPct: 0,
      shipping: {
        ...DEFAULT_STORE.shipping,
        padrao: { ...DEFAULT_STORE.shipping.padrao, price: 0, freeFrom: 99 },
      },
    });
    const barato = PRODUCTS.find((p) => p.preco < 99 && p.tamanhos.includes("37"))!;
    for (const id of ["gratis", "padrao"] as const) {
      const q = quoteOrder([{ id: barato.id, tamanho: "37", qtd: 1 }], id);
      expect(q.frete).toMatchObject({ id: "rapido", price: 19.9 });
      expect(q.totalCents).toBe(Math.round(barato.preco * 100) + 1990);
      expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
    }
    const qtd = Math.ceil(99 / barato.preco);
    expect(quoteOrder([{ id: barato.id, tamanho: "37", qtd }], "gratis").frete).toMatchObject({
      id: "gratis",
      price: 0,
    });
  });

  it("configuração salva antes do frete mínimo continua válida, com frete grátis para todos", () => {
    applyStore({
      discountPct: 30,
      shipping: {
        padrao: { eta: "5 a 8 dias úteis" },
        express: { price: 34.9, eta: "2 a 4 dias úteis" },
      },
    });
    expect(store.discountPct).toBe(30);
    expect(store.shipping.padrao).toMatchObject({ price: 14.9, freeFrom: 0 });
  });

  it("por padrão (frete mínimo 0) o frete é grátis em todo pedido", () => {
    applyStore(DEFAULT_STORE);
    const barato = PRODUCTS.find((p) => p.preco < 30 && p.tamanhos.includes("37")) ?? sandalia;
    expect(quoteOrder([{ id: barato.id, tamanho: "37", qtd: 1 }], "gratis").frete.price).toBe(0);
  });

  it("Frete Rápido: pago, entre o grátis e o Express, e vai ao gateway", () => {
    applyStore(DEFAULT_STORE);
    const q = quoteOrder([{ id: sandalia.id, tamanho: "37", qtd: 1 }], "rapido");
    expect(q.frete).toMatchObject({ id: "rapido", name: "Frete Rápido", price: 19.9 });
    expect(q.frete.price).toBeLessThan(store.shipping.express.price);
    expect(q.gatewayItems.at(-1)).toMatchObject({
      title: "Frete Rápido",
      unitPriceCents: 1990,
      tangible: false,
    });
    expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
  });

  it("configuração salva sem o Frete Rápido ganha o valor padrão dele", () => {
    applyStore({
      discountPct: 50,
      shipping: {
        padrao: { eta: "5 a 8 dias úteis" },
        express: { price: 34.9, eta: "2 a 4 dias úteis" },
      },
    });
    expect(store.discountPct).toBe(50);
    expect(store.shipping.rapido).toEqual({ price: 19.9, eta: "3 a 6 dias úteis" });
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
    const p = PRODUCTS.find((x) => x.id === bump.productIds[0])!;
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
    const fora = PRODUCTS.find((x) => !ORDER_BUMPS.some((b) => b.productIds.includes(x.id)))!;
    expect(() =>
      quoteOrder([{ id: fora.id, tamanho: fora.tamanhos[0]!, qtd: 1, bump: true }], "gratis"),
    ).toThrow("oferta");
  });

  it("oferta de coturnos: escolhe 1 dos 4 modelos, com 50% a mais de desconto", () => {
    applyStore({ ...DEFAULT_STORE, discountPct: 50 });
    const bump = ORDER_BUMPS.find((b) => b.title === "Coturno")!;
    expect(bump.productIds).toHaveLength(4);
    expect(bump.discountPct).toBe(50);
    for (const id of bump.productIds) {
      const p = PRODUCTS.find((x) => x.id === id)!;
      expect(p.categoria).toBe("botas");
      const q = quoteOrder([{ id, tamanho: "37", qtd: 1, bump: true }], "gratis");
      expect(q.lines[0]!.unit).toBe(Math.round(priceOf(p).price * 50) / 100);
    }
    // Só 1 coturno por pedido, mesmo escolhendo modelos diferentes.
    expect(() =>
      quoteOrder(
        [
          { id: bump.productIds[0]!, tamanho: "37", qtd: 1, bump: true },
          { id: bump.productIds[1]!, tamanho: "37", qtd: 1, bump: true },
        ],
        "gratis",
      ),
    ).toThrow("oferta");
  });
});
