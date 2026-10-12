// TikTok Events API (servidor). Nunca lança: falha no TikTok não quebra a loja.
import { createHash } from "crypto";

export type TiktokConfig = {
  pixelId: string | null;
  accessToken: string | null;
  testCode: string | null;
};

const KEYS = ["tiktok_pixel_id", "tiktok_access_token", "tiktok_test_code"] as const;

export async function getTiktokConfig(): Promise<TiktokConfig> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("private_settings")
    .select("key,value")
    .in("key", [...KEYS]);
  const m = new Map((data ?? []).map((r) => [r.key, r.value]));
  return {
    pixelId: m.get("tiktok_pixel_id") || null,
    accessToken: m.get("tiktok_access_token") || null,
    testCode: m.get("tiktok_test_code") || null,
  };
}

export async function saveTiktokConfig(c: {
  pixelId: string;
  accessToken?: string;
  testCode: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const now = new Date().toISOString();
  const rows = [
    { key: "tiktok_pixel_id", value: c.pixelId, updated_at: now },
    { key: "tiktok_test_code", value: c.testCode, updated_at: now },
  ];
  // Token só é substituído quando um novo é digitado.
  if (c.accessToken)
    rows.push({ key: "tiktok_access_token", value: c.accessToken, updated_at: now });
  const { error } = await supabaseAdmin.from("private_settings").upsert(rows);
  if (error) throw new Error(error.message);
}

const sha = (v: string) => createHash("sha256").update(v.trim().toLowerCase()).digest("hex");

export type TiktokUser = {
  email?: string;
  phone?: string; // só dígitos, com ou sem 55
  cpf?: string;
  ip?: string | null;
  ua?: string | null;
  /** Id do clique no anúncio (?ttclid= da página de entrada). */
  ttclid?: string | null;
  /** Cookie _ttp do pixel. */
  ttp?: string | null;
};

export type TiktokEvent = {
  /** Nome do evento padrão do TikTok (ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, CompletePayment). */
  event: string;
  /** Mesmo event_id do navegador: o TikTok junta os dois e conta uma vez só. */
  eventId: string;
  url?: string;
  user: TiktokUser;
  properties?: Record<string, unknown>;
};

/** Envia um evento. Sem pixel ou token configurado, não envia e responde ok (canal desligado). */
export async function sendTiktokEvent(
  ev: TiktokEvent,
): Promise<{ ok: boolean; error?: string; skipped?: string }> {
  try {
    const cfg = await getTiktokConfig();
    if (!cfg.pixelId || !cfg.accessToken) return { ok: true, skipped: "TikTok não configurado" };
    const u = ev.user;
    const phone = u.phone?.replace(/\D/g, "");
    const user: Record<string, unknown> = {
      email: u.email ? sha(u.email) : undefined,
      phone: phone ? sha(`+${phone.startsWith("55") ? phone : `55${phone}`}`) : undefined,
      external_id: u.cpf ? sha(u.cpf.replace(/\D/g, "")) : undefined,
      ip: u.ip ?? undefined,
      user_agent: u.ua ?? undefined,
      ttclid: u.ttclid ?? undefined,
      ttp: u.ttp ?? undefined,
    };
    const body: Record<string, unknown> = {
      event_source: "web",
      event_source_id: cfg.pixelId,
      data: [
        {
          event: ev.event,
          event_time: Math.floor(Date.now() / 1000),
          event_id: ev.eventId,
          user,
          page: ev.url ? { url: ev.url } : undefined,
          properties: ev.properties,
        },
      ],
    };
    if (cfg.testCode) body["test_event_code"] = cfg.testCode;
    const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Access-Token": cfg.accessToken },
      body: JSON.stringify(body),
    });
    // O TikTok responde 200 também nos erros: o resultado real vem em "code" (0 = ok).
    const j = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
    if (!res.ok || j?.code !== 0) {
      const error = `${res.status} ${j?.message ?? ""}`.trim().slice(0, 200);
      console.error("TikTok Events API error", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    console.error("TikTok Events API failed", e);
    return { ok: false, error: "Falha de conexão" };
  }
}
