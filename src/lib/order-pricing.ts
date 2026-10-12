// Cálculo do pedido a partir da sacola. Função pura: o servidor usa para cobrar e o checkout só para
// exibir. Preço sempre do catálogo + configuração da loja, nunca o que o navegador mandou.
import { getProduct, itemLabel } from "@/lib/catalog";
import { fretes, priceOf, type Frete, type FreteId } from "@/lib/store-settings";
import type { GatewayItem } from "@/lib/gateway-items";
import { bumpPrice, getBump } from "@/lib/order-bumps";

export type OrderItemInput = {
  id: string;
  tamanho: string;
  qtd: number;
  /** Item adicionado pelo order bump do checkout (preço da oferta, 1 unidade). */
  bump?: boolean;
};

export type OrderLine = {
  id: string;
  ref: string;
  marca: string;
  nome: string;
  tamanho: string;
  qtd: number;
  /** Preço unitário em reais. */
  unit: number;
  /** Custo unitário em reais (quando cadastrado). */
  custo?: number;
  label: string;
  bump?: boolean;
};

export type OrderQuote = {
  lines: OrderLine[];
  /** Reais. */
  subtotal: number;
  frete: Frete;
  /** Centavos. */
  totalCents: number;
  /** Itens enviados ao gateway (produtos reais + frete). A soma bate com totalCents. */
  gatewayItems: GatewayItem[];
  /** Resumo legível ("2x Sandália Moleca Ref. 5667.802 (tam. 37) + ..."). */
  summary: string;
};

export class OrderError extends Error {}

const cents = (v: number) => Math.round(v * 100);

export function quoteOrder(items: readonly OrderItemInput[], freteId: FreteId): OrderQuote {
  if (!items.length) throw new OrderError("Sua sacola está vazia.");
  // Junta linhas repetidas (mesmo produto, tamanho e oferta).
  const merged = new Map<string, OrderItemInput>();
  for (const it of items) {
    const k = `${it.id}|${it.tamanho}|${it.bump ? "bump" : ""}`;
    const cur = merged.get(k);
    merged.set(k, cur ? { ...cur, qtd: cur.qtd + it.qtd } : { ...it });
  }
  const lines: OrderLine[] = [...merged.values()].map((it) => {
    const p = getProduct(it.id);
    if (!p) throw new OrderError("Um produto da sacola não está mais disponível.");
    if (!p.tamanhos.includes(it.tamanho))
      throw new OrderError(`O tamanho ${it.tamanho} de ${p.nome} não está disponível.`);
    if (!Number.isInteger(it.qtd) || it.qtd < 1 || it.qtd > 10)
      throw new OrderError("Quantidade inválida.");
    const bump = it.bump ? getBump(p.id) : undefined;
    if (it.bump && (!bump || it.qtd !== 1))
      throw new OrderError("Esta oferta não está mais disponível.");
    return {
      id: p.id,
      ref: p.ref,
      marca: p.marca,
      nome: p.nome,
      tamanho: it.tamanho,
      qtd: it.qtd,
      unit: bump ? bumpPrice(p, bump).price : priceOf(p).price,
      ...(p.custo != null ? { custo: p.custo } : {}),
      label: itemLabel(p, it.tamanho),
      ...(bump ? { bump: true } : {}),
    };
  });
  const subtotalCents = lines.reduce((s, l) => s + cents(l.unit) * l.qtd, 0);
  const subtotal = subtotalCents / 100;
  // "gratis" e "padrao" são a mesma opção: o valor do pedido decide se o frete sai de graça.
  const options = fretes(subtotal);
  const frete =
    freteId === "gratis" || freteId === "padrao"
      ? options[0]
      : options.find((f) => f.id === freteId);
  if (!frete) throw new OrderError("Opção de frete indisponível para este pedido.");

  const gatewayItems: GatewayItem[] = lines.map((l) => ({
    title: l.label.slice(0, 120),
    quantity: l.qtd,
    unitPriceCents: cents(l.unit),
    tangible: true,
  }));
  if (frete.price > 0)
    gatewayItems.push({
      title: frete.name,
      quantity: 1,
      unitPriceCents: cents(frete.price),
      tangible: false,
    });

  return {
    lines,
    subtotal,
    frete,
    totalCents: subtotalCents + cents(frete.price),
    gatewayItems,
    summary: lines.map((l) => `${l.qtd}x ${l.label}`).join(" + "),
  };
}
