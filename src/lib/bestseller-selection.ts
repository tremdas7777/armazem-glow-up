import { PRODUCTS } from "@/lib/catalog";
import { SANDAL_ID } from "@/lib/featured-sandal";
import { MARKET_EVIDENCE } from "@/lib/market-evidence";
import { selectMarketProducts } from "@/lib/market-selection";

/** Explicit owner placement stays separate from externally verified market evidence. */
export function bestsellerProducts() {
  const ownerIds = [SANDAL_ID, "m5667-802", "m5835-100", "m50042-13"];
  const ownerProducts = ownerIds.flatMap((id) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return product ? [product] : [];
  });
  return [
    ...ownerProducts,
    ...selectMarketProducts(PRODUCTS, MARKET_EVIDENCE).filter((p) => !ownerIds.includes(p.id)),
  ];
}