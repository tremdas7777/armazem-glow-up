import { afterEach, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { Price } from "@/components/store/ProductCard";
import { FEATURED_SANDAL } from "@/lib/featured-sandal";
import { applyStore, DEFAULT_STORE } from "@/lib/store-settings";

const text = (qty: number) =>
  render(<Price p={FEATURED_SANDAL} big qty={qty} />).container.textContent?.replace(/\s/g, " ");

describe("preço da papete na página do produto", () => {
  afterEach(() => applyStore(null));

  it("acompanha a quantidade de pares escolhida", () => {
    applyStore(DEFAULT_STORE);
    expect(text(1)).toBe("R$ 59,80R$ 29,90no Pix");
    expect(text(2)).toBe("R$ 119,60R$ 49,902 pares no Pix");
    expect(text(3)).toBe("R$ 179,40R$ 69,903 pares no Pix");
  });
});
