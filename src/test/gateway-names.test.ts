import { describe, expect, it } from "vitest";
import { quoteOrder } from "@/lib/order-pricing";
import { PRODUCTS } from "@/lib/catalog";

describe("nomes enviados ao gateway", () => {
  it("tiram a marca, mas mantêm tipo de produto, referência e tamanho", () => {
    const p = PRODUCTS.find((x) => x.nome.includes("Moleca") && x.tamanhos.length > 1)!;
    const q = quoteOrder([{ id: p.id, tamanho: p.tamanhos[0], qtd: 2 }], "gratis");
    const title = q.gatewayItems[0].title;
    expect(title).not.toMatch(/moleca/i);
    expect(title).toContain(`Ref. ${p.ref}`);
    expect(title).toContain(`(tam. ${p.tamanhos[0]})`);
    expect(title.split(" ")[0]).toBe(p.nome.split(" ")[0]);
    expect(q.gatewaySummary).toBe(`2x ${title}`);
    // O pedido salvo na loja continua com o nome real.
    expect(q.summary).toMatch(/Moleca/);
  });

  it("nenhum produto do catálogo leva a marca para o gateway", () => {
    for (const p of PRODUCTS) {
      const q = quoteOrder([{ id: p.id, tamanho: p.tamanhos[0], qtd: 1 }], "gratis");
      expect(q.gatewaySummary).not.toMatch(/moleca/i);
    }
  });
});
