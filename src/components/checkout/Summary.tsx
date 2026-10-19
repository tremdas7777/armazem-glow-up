import { useState } from "react";
import { ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { MAX_QTY, type CartLine } from "@/lib/cart";
import { brl } from "@/lib/store-settings";
import { ProductImage } from "@/components/store/ProductCard";
import { cn } from "@/lib/utils";

/** Edição da sacola no resumo. `canEdit` falso = linha fixa (ex.: oferta do order bump). */
export type SummaryEdit = {
  canEdit: (l: CartLine) => boolean;
  setQty: (l: CartLine, qtd: number) => void;
  remove: (l: CartLine) => void;
};

type Props = { lines: CartLine[]; subtotal: number; frete: number; edit?: SummaryEdit };

function QtyControls({ l, edit }: { l: CartLine; edit: SummaryEdit }) {
  const btn = "flex h-7 w-7 items-center justify-center text-foreground disabled:opacity-30";
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="flex items-center rounded-md border">
        <button
          type="button"
          className={btn}
          aria-label={`Diminuir quantidade de ${l.product.nome}`}
          disabled={l.qtd <= 1}
          onClick={() => edit.setQty(l, l.qtd - 1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-6 text-center text-[13px] font-semibold">{l.qtd}</span>
        <button
          type="button"
          className={btn}
          aria-label={`Aumentar quantidade de ${l.product.nome}`}
          disabled={l.qtd >= MAX_QTY}
          onClick={() => edit.setQty(l, l.qtd + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <button
        type="button"
        className="flex items-center gap-1 text-[12px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        onClick={() => edit.remove(l)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remover
      </button>
    </div>
  );
}

function Lines({ lines, edit }: { lines: CartLine[]; edit?: SummaryEdit }) {
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
              {l.product.marca ? `${l.product.marca} · ` : ""}Ref. {l.product.ref} · Tam. {l.tamanho}
            </p>
            {edit?.canEdit(l) && <QtyControls l={l} edit={edit} />}
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

export function SummaryDesktop({ lines, subtotal, frete, edit }: Props) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-6 space-y-4 rounded-xl border bg-card p-5">
        <p className="text-base font-semibold">Resumo do pedido</p>
        <Lines lines={lines} edit={edit} />
        <Totals subtotal={subtotal} frete={frete} />
      </div>
    </aside>
  );
}

export function SummaryMobile({ lines, subtotal, frete, edit }: Props) {
  const [open, setOpen] = useState(false);
  const count = lines.reduce((s, l) => s + l.qtd, 0);
  return (
    <div className="mx-3 mb-3 rounded-xl border bg-card lg:hidden">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[13px]">Resumo do pedido ({count})</span>
        <span className="flex items-center gap-2 text-[15px] font-semibold">
          {brl(subtotal + frete)}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open && (
        <div className="space-y-4 px-4 pb-4">
          <Lines lines={lines} edit={edit} />
          <Totals subtotal={subtotal} frete={frete} />
        </div>
      )}
    </div>
  );
}
