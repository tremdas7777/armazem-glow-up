import { describe, expect, it } from "vitest";
import { PRODUCTS } from "@/lib/catalog";
import { MARKET_EVIDENCE } from "@/lib/market-evidence";
import { selectMarketProducts } from "@/lib/market-selection";

describe("research-based merchandising", () => {
  it("includes only the three exact catalog references verified in the external bestseller list", () => {
    expect(selectMarketProducts(PRODUCTS, MARKET_EVIDENCE).map((p) => p.ref))
      .toEqual(["5726.115", "5287.210", "520.59"]);
  });

  it("excludes inactive and missing models rather than filling with unrelated launches", () => {
    const products = PRODUCTS.map((p) => p.ref === "5726.115" ? { ...p, ativo: false } : p)
      .filter((p) => p.ref !== "520.59");
    expect(selectMarketProducts(products, MARKET_EVIDENCE).map((p) => p.ref)).toEqual(["5287.210"]);
  });

  it("leaves catalog prices and store sales flags unchanged", () => {
    const before = structuredClone(PRODUCTS);
    selectMarketProducts(PRODUCTS, MARKET_EVIDENCE);
    expect(PRODUCTS).toEqual(before);
  });
});