import { describe, expect, it, afterEach } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { FEATURED_SANDAL, SANDAL_ID, sandalOption } from "@/lib/featured-sandal";
import { bestsellerProducts } from "@/lib/bestseller-selection";
import { applyStore, priceOf } from "@/lib/store-settings";

afterEach(() => applyStore(undefined));

describe("requested Moleca sandal", () => {
  it("costs exactly R$ 29.90 with the existing store discount", () => {
    applyStore(undefined);
    expect(priceOf(FEATURED_SANDAL).price).toBe(29.90);
  });

  it("has a single catalog entry and a single bestseller placement", () => {
    expect(PRODUCTS.filter((p) => p.id === SANDAL_ID)).toHaveLength(1);
    expect(bestsellerProducts().filter((p) => p.id === SANDAL_ID)).toHaveLength(1);
  });

  it("keeps the papete first in the bestselling selection", () => {
    expect(bestsellerProducts()[0]?.id).toBe(SANDAL_ID);
  });

  it("includes four sneakers in owner-selected bestsellers", () => {
    expect(bestsellerProducts().filter((p) => p.categoria === "tenis").map((p) => p.id)).toEqual([
      "m5667-802", "m5796-118", "m5835-100", "m5835-210",
    ]);
  });

  it("includes the selected bags in bestsellers", () => {
    expect(bestsellerProducts().filter((p) => p.categoria === "bolsas").map((p) => p.id)).toEqual([
      "m50042-13", "m50065-4", "m50007-1",
    ]);
  });

  it("includes three boots in bestsellers", () => {
    expect(bestsellerProducts().filter((p) => p.categoria === "botas").map((p) => p.id)).toEqual([
      "m5352-100", "m5344-202", "m5346-107",
    ]);
  });

  it("keeps every uploaded color in order-compatible size selections", () => {
    expect(FEATURED_SANDAL.cores?.map((c) => c.nome)).toEqual([
      "Preto", "Azul", "Off-white cobre", "Nude", "Pink", "Off-white", "Nude dourado",
    ]);
    for (const color of FEATURED_SANDAL.cores ?? []) {
      expect(FEATURED_SANDAL.tamanhos).toContain(sandalOption("36", color.nome));
      expect(sandalOption("36", color.nome).length).toBeLessThanOrEqual(20);
    }
  });
});