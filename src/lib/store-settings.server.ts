// Configuração da loja no servidor. Somente servidor.
import { applyStore, STORE_SETTING_KEY, type StoreConfig } from "@/lib/store-settings";

/**
 * Lê a configuração salva no banco e aplica. Roda antes de cada cobrança, para o valor cobrado ser
 * sempre o do painel. Se o banco falhar, não cobra (lança erro).
 */
export async function syncStoreFromDb(): Promise<StoreConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", STORE_SETTING_KEY)
    .maybeSingle();
  if (error) throw new Error("Não foi possível carregar a configuração da loja. Tente novamente.");
  return applyStore(data?.value ?? null);
}
