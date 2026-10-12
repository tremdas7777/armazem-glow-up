// Preço por quantidade da papete: 1 = R$ 29,90 · 2 = R$ 49,90 · 3 = R$ 69,90; acima de 3 a escada
// recomeça (4 = 3 + 1, 5 = 3 + 2...). Soma todas as cores e tamanhos. A mesma regra vale para a
// sacola (exibir) e para o servidor (cobrar), então o total mostrado é sempre o cobrado.
import { SANDAL_ID } from "@/lib/featured-sandal";

export const QTY_PROMO = {
  productId: SANDAL_ID,
  /** Total (centavos) para 1, 2 e 3 unidades. */
  tiersCents: [2990, 4990, 6990] as const,
};

export const isQtyPromo = (productId: string) => productId === QTY_PROMO.productId;

/** Total da promoção (centavos) para `n` unidades. */
export function promoTotalCents(n: number): number {
  const t = QTY_PROMO.tiersCents;
  if (n <= 0) return 0;
  const rest = n % t.length;
  return Math.floor(n / t.length) * t[t.length - 1]! + (rest ? t[rest - 1]! : 0);
}

/**
 * Divide a promoção entre as linhas, na ordem: cada linha recebe grupos de unidades com preço
 * inteiro em centavos, e a soma de tudo é exatamente o total da promoção.
 */
export function splitQtyPromo<T extends { qtd: number }>(
  lines: readonly T[],
): { line: T; parts: { qtd: number; unitCents: number }[] }[] {
  const n = lines.reduce((s, l) => s + l.qtd, 0);
  const total = promoTotalCents(n);
  const base = Math.floor(total / n);
  const extra = total - base * n; // as primeiras `extra` unidades levam 1 centavo a mais
  let i = 0;
  return lines.map((line) => {
    const parts: { qtd: number; unitCents: number }[] = [];
    for (let k = 0; k < line.qtd; k++, i++) {
      const unitCents = base + (i < extra ? 1 : 0);
      const last = parts.at(-1);
      if (last?.unitCents === unitCents) last.qtd++;
      else parts.push({ qtd: 1, unitCents });
    }
    return { line, parts };
  });
}
