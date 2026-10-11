import { Truck } from "lucide-react";
import { brl, isFreeShippingEligible, store } from "@/lib/store-settings";
import { cn } from "@/lib/utils";

/** Frete grátis a partir do mínimo do /admin: quanto falta, ou "Você ganhou frete grátis". */
export function FreeShippingProgress({ subtotal, className }: { subtotal: number; className?: string }) {
  const min = store.freeShippingMin;
  if (min <= 0) return null;
  const ok = isFreeShippingEligible(subtotal);
  const pct = Math.min(100, (subtotal / min) * 100);
  return (
    <div className={cn("rounded-lg border border-border px-4 py-3 text-[13px]", className)}>
      <p className="flex items-center gap-2">
        <Truck className="h-4 w-4 shrink-0" aria-hidden />
        {ok ? (
          <span>
            <b>Você ganhou frete grátis!</b>
          </span>
        ) : (
          <span>
            Faltam <b>{brl(Math.max(0, min - subtotal))}</b> em produtos para o frete grátis.
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
