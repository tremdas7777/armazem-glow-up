// Order bumps do checkout: ofertas de 1 clique na etapa de pagamento. O preço sai daqui tanto para
// exibir quanto para cobrar (order-pricing.ts), então o navegador nunca escolhe o desconto.
import { getProduct, type Produto } from "@/lib/catalog";
import { priceOf } from "@/lib/store-settings";

export type OrderBump = {
  productId: string;
  /** Desconto extra (%) sobre o preço atual da loja. 0 = mesmo preço da loja. */
  discountPct: number;
};

export const ORDER_BUMPS: readonly OrderBump[] = [
  { productId: "m50073-1", discountPct: 0 },
  { productId: "m5832-314", discountPct: 30 },
];

export const getBump = (productId: string) => ORDER_BUMPS.find((b) => b.productId === productId);

const round = (n: number) => Math.round(n * 100) / 100;

/** Preço da oferta e o preço "de" para riscar (o maior entre tabela e loja). */
export function bumpPrice(p: Produto, b: OrderBump): { price: number; compareAt: number | null } {
  const loja = priceOf(p);
  const price = round(loja.price * (1 - b.discountPct / 100));
  const base = loja.compareAt ?? loja.price;
  return { price, compareAt: base > price ? base : null };
}

/** Ofertas com produto ativo no catálogo. */
export const activeBumps = () =>
  ORDER_BUMPS.flatMap((b) => {
    const product = getProduct(b.productId);
    return product ? [{ ...b, product }] : [];
  });
