import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { brand } from "@/lib/brand";
import {
  saveOrder,
  fetchGatewayStatus,
  reportPaidOnce,
  reportPendingToUtmify,
} from "@/lib/pix-orders.server";
import { createPix } from "@/lib/pix-gateway.server";
import { syncStoreFromDb } from "@/lib/store-settings.server";
import { isPaidStatus } from "@/lib/pix-status";
import { OrderError, quoteOrder } from "@/lib/order-pricing";

const utmSchema = z.record(z.string(), z.string().max(300).nullable()).optional().default({});

function isValidCpf(raw: string): boolean {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  for (const t of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(c[i]) * (t + 1 - i);
    const d = ((sum * 10) % 11) % 10;
    if (d !== Number(c[t])) return false;
  }
  return true;
}

const itemSchema = z.object({
  id: z.string().min(1).max(64),
  tamanho: z.string().min(1).max(20),
  qtd: z.number().int().min(1).max(10),
});

const customerSchema = z.object({
  items: z.array(itemSchema).min(1).max(30),
  name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(160),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10).max(11)),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidCpf, "CPF inválido"),
  origin: z.string().url(),
  frete: z.enum(["gratis", "padrao", "express"]).default("padrao"),
  endereco: z.string().max(300).optional(),
  address: z.object({
    street: z.string().trim().min(1).max(200),
    number: z.string().trim().min(1).max(20),
    complement: z.string().trim().max(200).optional(),
    neighborhood: z.string().trim().min(1).max(120),
    city: z.string().trim().min(1).max(120),
    state: z.string().trim().length(2),
    zipcode: z.string().regex(/^\d{8}$/),
  }),
  utm: utmSchema,
});

export type PixCharge = { id: string; qrcode: string; amount: number; status: string };

function requestMeta() {
  const h = getRequest()?.headers;
  return {
    ip: h?.get("cf-connecting-ip") ?? h?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    ua: h?.get("user-agent") ?? null,
  };
}

export const createPixCharge = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => customerSchema.parse(d))
  .handler(async ({ data }): Promise<PixCharge> => {
    // Preço sempre do catálogo + configuração do /admin (desconto, frete), nunca o do navegador.
    await syncStoreFromDb();
    let quote;
    try {
      quote = quoteOrder(data.items, data.frete);
    } catch (e) {
      if (e instanceof OrderError) throw new Error(e.message);
      throw e;
    }
    const { ip, ua } = requestMeta();
    // Pix gerado no gateway escolhido no /admin, com os nomes reais dos produtos.
    const charge = await createPix({
      amount: quote.totalCents,
      customer: { name: data.name, email: data.email, phone: data.phone, cpf: data.cpf },
      description: `Pedido ${brand.name}: ${quote.summary}`.slice(0, 250),
      items: quote.gatewayItems,
      origin: data.origin,
      address: data.address,
      ip,
    });
    // Guarda o pedido no servidor para reportar a aprovação mesmo sem o cliente na página.
    const orderData = {
      createdAt: Date.now(),
      id: charge.id,
      amountCents: quote.totalCents,
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpf: data.cpf,
        endereco: data.endereco?.replace(/\s+/g, " ").trim(),
        address: data.address,
        // Pix copia e cola, para o admin poder reenviar ao cliente.
        qrcode: charge.qrcode,
        frete: { id: quote.frete.id, name: quote.frete.name, price: quote.frete.price },
        items: quote.lines,
        method: "pix" as const,
      },
      bundleId: "sacola",
      bundleName: quote.summary.slice(0, 500),
      utm: data.utm,
      ip,
      ua,
    };
    await saveOrder(orderData);
    // Pix gerado → UTMify como pendente (não é conversão; só "paid" conta como venda).
    await reportPendingToUtmify(orderData);
    return { id: charge.id, qrcode: charge.qrcode, amount: quote.totalCents, status: charge.status };
  });

export const getPixStatus = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().regex(/^[\w-]{1,64}$/),
        report: z
          .object({
            fbp: z.string().max(200).nullable().optional(),
            fbc: z.string().max(300).nullable().optional(),
            url: z.string().max(1000).optional(),
          })
          .optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }): Promise<{ status: string; paid: boolean }> => {
    const { status, amount } = await fetchGatewayStatus(data.id);
    const paid = isPaidStatus(status);
    // Só pagamento confirmado pelo gateway (servidor) vira conversão — reportado uma única vez.
    if (paid) {
      const { ip, ua } = requestMeta();
      await reportPaidOnce(data.id, amount, {
        fbp: data.report?.fbp,
        fbc: data.report?.fbc,
        url: data.report?.url,
        ip,
        ua,
      });
    }
    return { status, paid };
  });
