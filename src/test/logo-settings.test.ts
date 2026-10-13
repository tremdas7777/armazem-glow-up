import { afterEach, describe, expect, it } from "vitest";
import { applyStore, DEFAULT_STORE, store } from "@/lib/store-settings";

describe("admin logo visibility", () => {
  afterEach(() => applyStore(null));

  it("activating hide logos hides all shared store logos", () => {
    applyStore({ ...DEFAULT_STORE, hideLogos: true });
    expect(store.hideLogos).toBe(true);
  });

  it("deactivating hide logos restores shared store logos", () => {
    applyStore({ ...DEFAULT_STORE, hideLogos: true });
    applyStore({ ...DEFAULT_STORE, hideLogos: false });
    expect(store.hideLogos).toBe(false);
  });

  it("existing saved configurations keep prices and shipping unchanged", () => {
    const legacy = { discountPct: 30, shipping: DEFAULT_STORE.shipping };
    applyStore(legacy);
    expect(store.hideLogos).toBe(false);
    expect(store.discountPct).toBe(30);
    expect(store.shipping).toEqual(legacy.shipping);
  });
});