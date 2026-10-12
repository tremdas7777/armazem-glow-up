import { PRODUCTS } from "@/lib/catalog";
import { SANDAL_ID } from "@/lib/featured-sandal";
import { MARKET_EVIDENCE } from "@/lib/market-evidence";
import { selectMarketProducts } from "@/lib/market-selection";

/** Explicit owner placement stays separate from externally verified market evidence. */
export function bestsellerProducts() {
  const ownerIds = [
    SANDAL_ID,
    "m5352-100", // bota salto bloco croco
    "m5667-802",
    "m50042-13",
    "m5344-202", // coturno
    "m5796-118",
    "m50065-4",
    "m5346-107", // bota com zíper
    "m5835-100",
    "m5835-210",
    "m50007-1",
  ];
  const ownerProducts = ownerIds.flatMap((id) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return product ? [product] : [];
  });
  return [
    ...ownerProducts,
    ...selectMarketProducts(PRODUCTS, MARKET_EVIDENCE).filter((p) => !ownerIds.includes(p.id)),
  ];
}