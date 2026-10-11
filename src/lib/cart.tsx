// Sacola de compras (navegador). Guarda só id, tamanho e quantidade: o preço vem sempre do
// catálogo + configuração da loja, e o servidor recalcula tudo antes de gerar o Pix.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getProduct, type Produto } from "@/lib/catalog";
import { priceOf } from "@/lib/store-settings";

export type CartItem = { id: string; tamanho: string; qtd: number };
export type CartLine = CartItem & { product: Produto; unit: number; total: number };

const KEY = "adc_sacola_v1";
export const MAX_QTY = 10;

type CartCtx = {
  items: CartItem[];
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (id: string, tamanho: string, qtd?: number) => void;
  setQty: (index: number, qtd: number) => void;
  remove: (index: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

function load(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as CartItem[];
    return Array.isArray(raw)
      ? raw.filter((it) => {
          const p = getProduct(it.id);
          return p && p.tamanhos.includes(String(it.tamanho)) && it.qtd > 0;
        })
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(load());
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // storage indisponível: a sacola vale só nesta aba
    }
  }, [items, ready]);

  const add = useCallback((id: string, tamanho: string, qtd = 1) => {
    setItems((cur) => {
      const i = cur.findIndex((it) => it.id === id && it.tamanho === tamanho);
      if (i < 0) return [...cur, { id, tamanho, qtd: Math.min(MAX_QTY, qtd) }];
      const next = [...cur];
      next[i] = { ...next[i]!, qtd: Math.min(MAX_QTY, next[i]!.qtd + qtd) };
      return next;
    });
  }, []);
  const setQty = useCallback(
    (index: number, qtd: number) =>
      setItems((cur) =>
        qtd <= 0
          ? cur.filter((_, i) => i !== index)
          : cur.map((it, i) => (i === index ? { ...it, qtd: Math.min(MAX_QTY, qtd) } : it)),
      ),
    [],
  );
  const remove = useCallback(
    (index: number) => setItems((cur) => cur.filter((_, i) => i !== index)),
    [],
  );
  const clear = useCallback(() => setItems([]), []);

  const lines = useMemo(
    () =>
      items.flatMap((it): CartLine[] => {
        const product = getProduct(it.id);
        if (!product) return [];
        const unit = priceOf(product).price;
        return [{ ...it, product, unit, total: Math.round(unit * it.qtd * 100) / 100 }];
      }),
    [items],
  );
  const value: CartCtx = {
    items,
    lines,
    count: items.reduce((s, it) => s + it.qtd, 0),
    subtotal: Math.round(lines.reduce((s, l) => s + l.total, 0) * 100) / 100,
    open,
    setOpen,
    add,
    setQty,
    remove,
    clear,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}
