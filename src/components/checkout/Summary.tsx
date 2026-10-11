import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { brl } from "@/lib/store-settings";
import { ProductImage } from "@/components/store/ProductCard";
import { FreeShippingProgress } from "./FreeShippingProgress";
import { cn } from "@/lib/utils";

type Props = { lines: CartLine[]; subtotal: number; frete: number };

function Lines({ lines }: { lines: CartLine[] }) {
  return (
    <ul className="space-y-4">
      {lines.map((l) => (
        <li key={`${l.id}-${l.tamanho}`} className="flex gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white [&_img]:h-full [&_img]:w-full [&_img]:object-contain">
            <ProductImage p={l.product} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-bold text-background">
              {l.qtd}
            </span>
          </div>
          <div className="min-w-0 flex-1 text-[13px]">
            <p className="font-medium leading-snug">{l.product.nome}</p>
            <p className="text-muted-foreground">
              {l.product.marca} · Ref. {l.product.ref} · Tam. {l.tamanho}
            </p>
          </div>
          <span className="text-[13px] font-semibold">{brl(l.total)}</span>
        </li>
      ))}
    </ul>
  );
}

function Totals({ subtotal, frete }: { subtotal: number; frete: number }) {
  return (
    <div className="space-y-2 border-t pt-4 text-[13px]">
      <div className="flex justify-between">
        <span>Produtos</span>
        <span>{brl(subtotal)}</span>
      </div>
      <div className="flex justify-between">
        <span>Frete</span>
        <span>{frete ? brl(frete) : "Grátis"}</span>
      </div>
      <div className="flex justify-between border-t pt-3 text-base font-semibold">
        <span>Total</span>
        <span>{brl(subtotal + frete)}</span>
      </div>
    </div>
  );
}

export function SummaryDesktop({ lines, subtotal, frete }: Props) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4 rounded-xl border bg-card p-5">
        <p className="text-base font-semibold">Resumo do pedido</p>
        <Lines lines={lines} />
        <FreeShippingProgress subtotal={subtotal} />
        <Totals subtotal={subtotal} frete={frete} />
      </div>
    </aside>
  );
}

export function SummaryMobile({ lines, subtotal, frete }: Props) {
  const [open, setOpen] = useState(false);
  const count = lines.reduce((s, l) => s + l.qtd, 0);
  return (
    <div className="mx-3 mb-3 rounded-xl border bg-card lg:hidden">
      <button type="button" className="flex w-full items-center justify-between p-4" onClick={() => setOpen((v) => !v)}>
        <span className="text-[13px]">Resumo do pedido ({count})</span>
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          {brl(subtotal + frete)}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="space-y-4 px-4 pb-4">
          <Lines lines={lines} />
          <Totals subtotal={subtotal} frete={frete} />
        </div>
      )}
    </div>
  );
}
