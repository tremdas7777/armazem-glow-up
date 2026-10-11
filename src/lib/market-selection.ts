import type { Produto } from "@/lib/catalog";

/** Editorial market research, not a ranking of this store's orders. */
export type MarketEvidence = {
  ref: string;
  sources: { url: string; observation: string }[];
};

export function selectMarketProducts(products: Produto[], evidence: readonly MarketEvidence[]): Produto[] {
  return evidence.flatMap(({ ref }) => {
    const product = products.find((item) => item.ref === ref && item.ativo !== false);
    return product ? [product] : [];
  });
}