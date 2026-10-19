// Order bumps do checkout: ofertas de 1 clique na etapa de pagamento. O preço sai daqui tanto para
// exibir quanto para cobrar (order-pricing.ts), então o navegador nunca escolhe o desconto.
import { getProduct, type Produto } from "@/lib/catalog";
import { priceOf } from "@/lib/store-settings";

export type OrderBump = {
  /** Produtos da oferta. Mais de um = a cliente escolhe o modelo (leva 1 unidade de um deles). */
  productIds: readonly string[];
  /** Desconto extra (%) sobre o preço atual da loja. 0 = mesmo preço da loja. */
  discountPct: number;
  /** Título da oferta quando há vários modelos (senão, o nome do produto). */
  title?: string;
};

export const ORDER_BUMPS: readonly OrderBump[] = [
  {
    productIds: ["m5344-202", "m5344-209", "m5344-302", "m5344-308"],
    discountPct: 50,
    title: "Coturno",
  },
  { productIds: ["m50073-1"], discountPct: 0 },
  { productIds: ["m5832-314"], discountPct: 30 },
];

/** Identificador estável da oferta (o primeiro produto dela). */
export const bumpKey = (b: OrderBump) => b.productIds[0]!;

export const getBump = (productId: string) =>
  ORDER_BUMPS.find((b) => b.productIds.includes(productId));

const round = (n: number) => Math.round(n * 100) / 100;

/** Preço da oferta e o preço "de" para riscar (o maior entre tabela e loja). */
export function bumpPrice(
  p: Produto,
  b: Pick<OrderBump, "discountPct">,
): { price: number; compareAt: number | null } {
  const loja = priceOf(p);
  const price = round(loja.price * (1 - b.discountPct / 100));
  const base = loja.compareAt ?? loja.price;
  return { price, compareAt: base > price ? base : null };
}

/** Ofertas com pelo menos um produto ativo no catálogo (só os modelos ativos). */
export const activeBumps = () =>
  ORDER_BUMPS.flatMap((b) => {
    const products = b.productIds.flatMap((id) => {
      const p = getProduct(id);
      return p ? [p] : [];
    });
    return products.length ? [{ ...b, key: bumpKey(b), products }] : [];
  });

export type ActiveBump = ReturnType<typeof activeBumps>[number];

/** Modelos da oferta que ainda não estão na sacola. */
export const bumpOptions = (b: ActiveBump, hide: ReadonlySet<string>) =>
  b.products.filter((p) => !hide.has(p.id));

/** Modelo escolhido (ou o primeiro disponível). */
export function pickedProduct(
  b: ActiveBump,
  pick: { productId?: string } | undefined,
  hide: ReadonlySet<string>,
): Produto | undefined {
  const options = bumpOptions(b, hide);
  return options.find((p) => p.id === pick?.productId) ?? options[0];
}
