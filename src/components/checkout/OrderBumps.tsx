import { Check } from "lucide-react";
import { ProductImage } from "@/components/store/ProductCard";
import { activeBumps, bumpPrice } from "@/lib/order-bumps";
import { brl } from "@/lib/store-settings";
import { cn } from "@/lib/utils";

/** Oferta marcada pelo cliente; `tamanho` vazio enquanto ele não escolheu. */
export type BumpPick = { on: boolean; tamanho: string };
export type BumpPicks = Record<string, BumpPick>;

/** Order bumps da etapa de pagamento: um clique adiciona o produto com o preço da oferta. */
export function OrderBumps({
  picks,
  onChange,
  hide,
}: {
  picks: BumpPicks;
  onChange: (picks: BumpPicks) => void;
  /** Produtos que já estão na sacola não aparecem como oferta. */
  hide: ReadonlySet<string>;
}) {
  const bumps = activeBumps().filter((b) => !hide.has(b.productId));
  if (!bumps.length) return null;
  const set = (id: string, pick: BumpPick) => onChange({ ...picks, [id]: pick });

  return (
    <div className="space-y-3">
      <p className="text-base font-medium">Aproveite e leve junto:</p>
      {bumps.map(({ productId, discountPct, product: p }) => {
        const single = p.tamanhos.length === 1;
        const pick = picks[productId] ?? { on: false, tamanho: single ? p.tamanhos[0]! : "" };
        const { price, compareAt } = bumpPrice(p, { productId, discountPct });
        return (
          <div
            key={productId}
            className={cn(
              "rounded-lg border-2 border-dashed p-3 transition-colors",
              pick.on ? "border-[var(--ck-green)] bg-[var(--ck-badge)]/40" : "border-border",
            )}
          >
            <button
              type="button"
              aria-pressed={pick.on}
              onClick={() => set(productId, { ...pick, on: !pick.on })}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
                <ProductImage p={p} />
              </span>
              <span className="min-w-0 flex-1 text-[13px]">
                <span className="block font-medium leading-snug">
                  {p.nome}
                  {discountPct > 0 && (
                    <span className="ml-2 rounded bg-[var(--ck-badge)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--ck-ok)]">
                      {discountPct}% off
                    </span>
                  )}
                </span>
                <span className="block text-muted-foreground">
                  {p.marca} · Ref. {p.ref}
                </span>
                <span className="mt-0.5 block">
                  {compareAt && <s className="mr-1.5 text-muted-foreground">{brl(compareAt)}</s>}
                  <b className="text-[var(--ck-green)]">{brl(price)}</b>
                </span>
              </span>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                  pick.on
                    ? "border-[var(--ck-green)] bg-[var(--ck-green)] text-white"
                    : "border-muted-foreground/50",
                )}
              >
                {pick.on && <Check className="h-3.5 w-3.5" aria-hidden />}
              </span>
            </button>
            <p className="mt-2 text-[12px] font-semibold">
              {pick.on ? "Adicionado ao pedido" : "Sim, quero adicionar ao meu pedido"}
            </p>
            {!single && (
              <div className="mt-2">
                <p
                  className={cn(
                    "text-[12px]",
                    pick.on && !pick.tamanho
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {pick.on && !pick.tamanho ? "Escolha o tamanho:" : "Tamanho:"}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {p.tamanhos.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set(productId, { on: true, tamanho: t })}
                      className={cn(
                        "min-w-9 rounded border px-2 py-1 text-[12px]",
                        pick.tamanho === t
                          ? "border-[var(--ck-blue)] bg-muted font-semibold"
                          : "border-border",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
