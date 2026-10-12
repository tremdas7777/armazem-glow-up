import { afterEach, describe, expect, it } from "vitest";
import { quoteOrder } from "@/lib/order-pricing";
import { itemsTotalCents } from "@/lib/gateway-items";
import { applyStore, DEFAULT_STORE } from "@/lib/store-settings";
import { FEATURED_SANDAL, sandalOption } from "@/lib/featured-sandal";
import { promoTotalCents, splitQtyPromo } from "@/lib/qty-promo";
import { PRODUCTS } from "@/lib/catalog";

const id = FEATURED_SANDAL.id;

describe("papete: preço por quantidade", () => {
  afterEach(() => applyStore(DEFAULT_STORE));

  it("1 = 29,90 · 2 = 49,90 · 3 = 69,90 e a escada recomeça acima de 3", () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(promoTotalCents)).toEqual([
      2990, 4990, 6990, 9980, 11980, 13980, 16970,
    ]);
  });

  it("soma cores e tamanhos diferentes e cobra exatamente o total da promoção", () => {
    for (const qtds of [[1], [2], [1, 1], [1, 1, 1], [2, 2, 3], [3, 4]]) {
      const items = qtds.map((qtd, i) => ({
        id,
        tamanho: sandalOption(String(34 + i), FEATURED_SANDAL.cores![i]!.nome),
        qtd,
      }));
      const n = qtds.reduce((s, q) => s + q, 0);
      const q = quoteOrder(items, "gratis");
      expect(q.totalCents).toBe(promoTotalCents(n));
      expect(itemsTotalCents(q.gatewayItems)).toBe(q.totalCents);
      expect(q.lines.reduce((s, l) => s + l.qtd, 0)).toBe(n);
    }
  });

  it("não mexe nos outros produtos do pedido", () => {
    const outro = PRODUCTS.find((p) => p.id !== id && p.tamanhos.includes("37"))!;
    const q = quoteOrder(
      [
        { id, tamanho: sandalOption("36", "Preto"), qtd: 2 },
        { id: outro.id, tamanho: "37", qtd: 1 },
      ],
      "gratis",
    );
    const outroLine = q.lines.find((l) => l.id === outro.id)!;
    expect(q.totalCents).toBe(4990 + Math.round(outroLine.unit * 100));
  });

  it("divide em centavos inteiros, sem sobra", () => {
    const parts = splitQtyPromo([{ qtd: 4 }, { qtd: 3 }]);
    const total = parts.flatMap((p) => p.parts).reduce((s, p) => s + p.qtd * p.unitCents, 0);
    expect(total).toBe(promoTotalCents(7));
  });
});
