import { Check } from "lucide-react";
import { ProductImage } from "@/components/store/ProductCard";
import { activeBumps, bumpOptions, bumpPrice, pickedProduct } from "@/lib/order-bumps";
import type { Produto } from "@/lib/catalog";
import { brl } from "@/lib/store-settings";
import { cn } from "@/lib/utils";

/**
 * Oferta marcada pela cliente; `tamanho` vazio enquanto ela não escolheu. `productId` é o modelo
 * escolhido quando a oferta tem vários (sem ele, vale o primeiro disponível).
 */
export type BumpPick = { on: boolean; tamanho: string; productId?: string };
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
  const bumps = activeBumps().filter((b) => bumpOptions(b, hide).length > 0);
  if (!bumps.length) return null;
  const set = (key: string, pick: BumpPick) => onChange({ ...picks, [key]: pick });

  return (
    <div className="space-y-3">
      <p className="text-base font-medium">Aproveite e leve junto:</p>
      {bumps.map((b) => {
        const { key, discountPct } = b;
        const options = bumpOptions(b, hide);
        const p = pickedProduct(b, picks[key], hide)!;
        const single = p.tamanhos.length === 1;
        const saved = picks[key];
        const pick: BumpPick = {
          on: saved?.on ?? false,
          tamanho: saved?.tamanho ?? (single ? p.tamanhos[0]! : ""),
          productId: p.id,
        };
        const { price, compareAt } = bumpPrice(p, b);
        const chooseModel = (m: Produto) =>
          set(key, {
            on: true,
            productId: m.id,
            // Mantém o tamanho se o outro modelo também tiver; senão, pede de novo.
            tamanho: m.tamanhos.includes(pick.tamanho)
              ? pick.tamanho
              : m.tamanhos.length === 1
                ? m.tamanhos[0]!
                : "",
          });
        return (
          <div
            key={key}
            className={cn(
              "rounded-lg border-2 border-dashed p-3 transition-colors",
              pick.on ? "border-[var(--ck-green)] bg-[var(--ck-badge)]/40" : "border-border",
            )}
          >
            <button
              type="button"
              aria-pressed={pick.on}
              onClick={() => set(key, { ...pick, on: !pick.on })}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
                <ProductImage p={p} />
              </span>
              <span className="min-w-0 flex-1 text-[13px]">
                <span className="block font-medium leading-snug">
                  {b.title ?? p.nome}
                  {discountPct > 0 && (
                    <span className="ml-2 rounded bg-[var(--ck-badge)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[var(--ck-ok)]">
                      +{discountPct}% off
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
            {options.length > 1 && (
              <div className="mt-2">
                <p className="text-[12px] text-muted-foreground">
                  Modelo ({options.length} opções):
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {options.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-label={`Modelo ref. ${m.ref}`}
                      aria-pressed={m.id === p.id}
                      onClick={() => chooseModel(m)}
                      className={cn(
                        "h-14 w-14 overflow-hidden rounded border bg-white p-0.5 [&_img]:h-full [&_img]:w-full [&_img]:object-contain",
                        m.id === p.id ? "border-2 border-[var(--ck-blue)]" : "border-border",
                      )}
                    >
                      <ProductImage p={m} />
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                      onClick={() => set(key, { on: true, tamanho: t, productId: p.id })}
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
