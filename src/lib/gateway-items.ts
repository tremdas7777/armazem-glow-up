/** Item enviado ao gateway na cobrança: nome real do produto, quantidade e preço unitário. */
export type GatewayItem = {
  title: string;
  quantity: number;
  /** Centavos. */
  unitPriceCents: number;
  /** Produto físico (o frete vai como item não físico). */
  tangible: boolean;
};

/** Soma dos itens em centavos (precisa bater com o valor da cobrança). */
export const itemsTotalCents = (items: readonly GatewayItem[]) =>
  items.reduce((s, it) => s + it.unitPriceCents * it.quantity, 0);
