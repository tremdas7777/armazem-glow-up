import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  applyStore,
  DEFAULT_STORE,
  store,
  storeConfigSchema,
  STORE_SETTING_KEY,
  type StoreConfig,
} from "@/lib/store-settings";

/** Configuração em uso (pública: a loja precisa dela para exibir). Sem banco, devolve a padrão. */
export const getStoreConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<StoreConfig> => {
    try {
      const { syncStoreFromDb } = await import("@/lib/store-settings.server");
      return await syncStoreFromDb();
    } catch {
      return structuredClone(store);
    }
  },
);

const pw = z.object({ password: z.string().min(1).max(200) });

function assertAdmin(password: string) {
  if (password !== process.env["ADMIN_PASSWORD"]) throw new Error("Não autorizado");
}

/** Salva a configuração (vale na hora para a loja, o checkout e as cobranças). */
export const saveStoreConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.extend({ config: storeConfigSchema }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").upsert({
      key: STORE_SETTING_KEY,
      value: data.config,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return applyStore(data.config);
  });

/** Volta à configuração padrão do código. */
export const resetStoreConfig = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => pw.parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_settings").delete().eq("key", STORE_SETTING_KEY);
    if (error) throw new Error(error.message);
    applyStore(null);
    return DEFAULT_STORE;
  });
