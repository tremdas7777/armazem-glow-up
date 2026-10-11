import { PRODUCTS } from "@/lib/catalog";
import { SANDAL_ID } from "@/lib/featured-sandal";
import { MARKET_EVIDENCE } from "@/lib/market-evidence";
import { selectMarketProducts } from "@/lib/market-selection";

/** Explicit owner placement stays separate from externally verified market evidence. */
export function bestsellerProducts() {
  return [
    ...PRODUCTS.filter((p) => p.id === SANDAL_ID),
    ...selectMarketProducts(PRODUCTS, MARKET_EVIDENCE).filter((p) => p.id !== SANDAL_ID),
  ];
}