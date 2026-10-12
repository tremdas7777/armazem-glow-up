import { createServerFn } from "@tanstack/react-start";
import { brand } from "@/lib/brand";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { getTiktokConfig, saveTiktokConfig, sendTiktokEvent } from "./tiktok.server";

function assertAdmin(password: string) {
  if (password !== process.env["ADMIN_PASSWORD"]) throw new Error("Não autorizado");
}

function reqMeta() {
  const r = getRequest();
  const h = r?.headers;
  const ip = h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  return { ip, ua: h?.get("user-agent") ?? null };
}

/** Público: só o ID do pixel (nunca o token). */
export const getTiktokPixelId = createServerFn({ method: "GET" }).handler(async () => {
  const c = await getTiktokConfig().catch(() => null);
  return { pixelId: c?.pixelId ?? null };
});

export const getTiktokAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const c = await getTiktokConfig();
    return {
      pixelId: c.pixelId ?? "",
      testCode: c.testCode ?? "",
      tokenHint: c.accessToken ? `••••${c.accessToken.slice(-4)}` : "",
    };
  });

export const saveTiktokAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        password: z.string().min(1).max(200),
        pixelId: z
          .string()
          .trim()
          .regex(
            /^[A-Z0-9]{10,40}$/i,
            "ID do pixel do TikTok: só letras e números (ex.: CXXXXXXXXXXXXXXXXXXX)",
          ),
        accessToken: z.string().trim().max(600).optional(),
        testCode: z.string().trim().max(40).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    await saveTiktokConfig({
      pixelId: data.pixelId.toUpperCase(),
      accessToken: data.accessToken || undefined,
      testCode: data.testCode,
    });
    return { ok: true };
  });

export const testTiktokAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    assertAdmin(data.password);
    const c = await getTiktokConfig();
    if (!c.pixelId || !c.accessToken)
      return { ok: false, error: "Salve o ID do pixel e o token antes" };
    // Teste = compra paga, igual ao que é enviado quando o Pix cai.
    return sendTiktokEvent({
      event: "CompletePayment",
      eventId: `test-purchase-${Date.now()}`,
      url: brand.siteUrl ? `${brand.siteUrl}/` : undefined,
      user: { ...reqMeta(), email: "maria.teste@example.com" },
      properties: { value: 87.9, currency: "BRL", content_type: "product" },
    });
  });

/** Eventos de navegação (espelho servidor do pixel do navegador, com o mesmo event_id). */
export const trackTiktokEvent = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        event: z.enum(["ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo"]),
        eventId: z.string().min(6).max(80),
        url: z.string().url().max(1000),
        ttclid: z.string().max(500).nullable().optional(),
        ttp: z.string().max(200).nullable().optional(),
        value: z.number().min(0).max(100000).optional(),
        contentId: z.string().max(80).optional(),
        contentName: z.string().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    await sendTiktokEvent({
      event: data.event,
      eventId: data.eventId,
      url: data.url,
      user: { ...reqMeta(), ttclid: data.ttclid, ttp: data.ttp },
      properties:
        data.value !== undefined
          ? {
              value: data.value,
              currency: "BRL",
              content_type: "product",
              ...(data.contentId
                ? { contents: [{ content_id: data.contentId, content_name: data.contentName }] }
                : {}),
            }
          : undefined,
    });
    return { ok: true };
  });
