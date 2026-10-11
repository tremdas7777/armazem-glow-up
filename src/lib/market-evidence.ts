import type { MarketEvidence } from "@/lib/market-selection";

/** Checked 2026-10-11. Reference-level matches; colors/materials may differ.
 * Snapshot of an external category ranking, not store sales or a live feed.
 */
export const MARKET_EVIDENCE: readonly MarketEvidence[] = [
  {
    ref: "5726.115",
    sources: [{
      url: "https://www.amazon.com.br/gp/bestsellers/fashion/17682074011",
      observation: "Explicit reference in Amazon Brasil's bestselling women's flats list: Nobuck at #6 and Napa Sardenha at #18 in the retrieved snapshot.",
    }],
  },
  {
    ref: "5287.210",
    sources: [{
      url: "https://www.amazon.com.br/gp/bestsellers/fashion/17682074011",
      observation: "Explicit reference in Amazon Brasil's bestselling women's flats list: Microperfuros at #10 and Lona Sider at #17 in the retrieved snapshot.",
    }],
  },
  {
    ref: "520.59",
    sources: [{
      url: "https://www.amazon.com.br/gp/bestsellers/fashion/17682074011",
      observation: "Explicit model 520.59 at #12 in Amazon Brasil's bestselling women's flats list in the retrieved snapshot.",
    }],
  },
];