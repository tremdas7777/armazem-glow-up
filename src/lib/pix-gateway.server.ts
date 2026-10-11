// Gateway do Pix escolhido no /admin: SagacePay (padrão) ou MagicPay. Somente servidor.
// A escolha vale para os próximos Pix. Cada pedido guarda no id qual gateway gerou o Pix
// (MagicPay "mp_", SagacePay sem prefixo), então a consulta de status e o webhook continuam no
// gateway certo mesmo depois de uma troca.
import {
  getMagicPayKeys,
  magicpayCashin,
  magicpayStatus,
  type MagicPayAddress,
} from "@/lib/magicpay.server";
import { getSagacePayKey, sagaceCashin, sagaceStatus } from "@/lib/sagacepay.server";
import { itemsTotalCents, type GatewayItem } from "@/lib/gateway-items";

export const PIX_GATEWAYS = ["sagacepay", "magicpay"] as const;
export type PixGateway = (typeof PIX_GATEWAYS)[number];
export const PIX_GATEWAY_LABEL: Record<PixGateway, string> = {
  sagacepay: "SagacePay",
  magicpay: "MagicPay",
};

/** Pedidos da MagicPay são guardados com este prefixo (os da SagacePay ficam sem prefixo). */
export const MAGICPAY_ORDER_PREFIX = "mp_";
export const isMagicpayOrderId = (id: string) => id.startsWith(MAGICPAY_ORDER_PREFIX);

const SETTING = "pix_gateway";
const DEFAULT_GATEWAY: PixGateway = "sagacepay";

export type PixCustomer = { name: string; email: string; phone: string; cpf: string };

/** O Pix expira em 30 minutos (mesmo prazo mostrado no checkout). */
export const PIX_EXPIRES_IN_SECONDS = 30 * 60;

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const isGateway = (v: unknown): v is PixGateway => PIX_GATEWAYS.includes(v as PixGateway);

/** Gateway escolhido no /admin (null = nunca escolhido). Sem cache: a troca vale na hora. */
async function savedChoice(): Promise<PixGateway | null> {
  const { data } = await (await db())
    .from("private_settings")
    .select("value")
    .eq("key", SETTING)
    .maybeSingle();
  return isGateway(data?.value) ? data.value : null;
}

/** Quais gateways têm chave cadastrada (painel ou secret do Lovable). */
async function configured(): Promise<Record<PixGateway, boolean>> {
  const [sagacepay, magicpay] = await Promise.all([
    getSagacePayKey().catch(() => null),
    getMagicPayKeys().catch(() => null),
  ]);
  return { sagacepay: !!sagacepay, magicpay: !!magicpay };
}

/**
 * Gateway que gera os próximos Pix: o escolhido no /admin (padrão: SagacePay). Se o escolhido
 * estiver sem chave e o outro tiver, usa o outro para o checkout não parar.
 */
export async function getPixGatewayState(): Promise<{
  selected: PixGateway;
  active: PixGateway;
  configured: Record<PixGateway, boolean>;
}> {
  const [choice, keys] = await Promise.all([savedChoice(), configured()]);
  const selected = choice ?? DEFAULT_GATEWAY;
  const fallback = PIX_GATEWAYS.find((g) => g !== selected && keys[g]);
  const active = !keys[selected] && fallback ? fallback : selected;
  return { selected, active, configured: keys };
}

export async function savePixGateway(gateway: PixGateway): Promise<void> {
  const keys = await configured();
  if (!keys[gateway]) {
    throw new Error(`Cadastre a chave da ${PIX_GATEWAY_LABEL[gateway]} antes de ativá-la.`);
  }
  const { error } = await (await db())
    .from("private_settings")
    .upsert({ key: SETTING, value: gateway, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

/**
 * Gera a cobrança Pix no gateway ativo. Valor em centavos, igual à soma dos itens (produtos reais
 * + frete). O id devolvido já vem com o prefixo do gateway.
 */
export async function createPix(o: {
  amount: number;
  customer: PixCustomer;
  /** Resumo do pedido com os nomes reais dos produtos. */
  description: string;
  items: GatewayItem[];
  origin: string;
  /** Endereço por partes (a MagicPay pede; a SagacePay ignora). */
  address?: MagicPayAddress | undefined;
  ip?: string | null | undefined;
}): Promise<{ id: string; qrcode: string; status: string }> {
  if (itemsTotalCents(o.items) !== o.amount) {
    throw new Error("Valor do pedido não confere com os itens.");
  }
  const { active } = await getPixGatewayState();
  const webhook = `${new URL(o.origin).origin}/api/public/pix-webhook`;
  if (active === "magicpay") {
    const tx = await magicpayCashin({
      amountCents: o.amount,
      customer: o.customer,
      address: o.address,
      description: o.description,
      items: o.items,
      postbackUrl: `${webhook}?gw=mp`,
      externalRef: crypto.randomUUID(),
      ip: o.ip,
    });
    return { ...tx, id: `${MAGICPAY_ORDER_PREFIX}${tx.id}` };
  }
  return sagaceCashin({
    amountCents: o.amount,
    customer: o.customer,
    description: o.description,
    items: o.items,
    postbackUrl: webhook,
    externalId: crypto.randomUUID(),
    expiresInSeconds: PIX_EXPIRES_IN_SECONDS,
  });
}

/** Status real de um pedido no gateway que gerou o Pix. Valor em centavos. */
export async function fetchPixStatus(id: string): Promise<{ status: string; amount: number }> {
  if (isMagicpayOrderId(id)) return magicpayStatus(id.slice(MAGICPAY_ORDER_PREFIX.length));
  return sagaceStatus(id);
}
