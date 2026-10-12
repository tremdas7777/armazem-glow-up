// Pixel do TikTok no navegador + espelho no servidor (Events API) com deduplicação por event_id.
import { trackTiktokEvent } from "./tiktok.functions";

type Ttq = {
  page: () => void;
  track: (event: string, props?: Record<string, unknown>, opts?: { event_id?: string }) => void;
};
declare global {
  interface Window {
    ttq?: Ttq;
  }
}

const TTCLID_KEY = "loja_ttclid";
let loadedId: string | null = null;
const pending: Array<() => void> = [];

function ready() {
  return typeof window !== "undefined" && !!loadedId && !!window.ttq;
}

/** Carrega o pixel com o código oficial do TikTok (uma vez por ID). */
export function loadTiktokPixel(pixelId: string) {
  if (typeof window === "undefined" || loadedId === pixelId) return;
  if (!/^[A-Z0-9]+$/i.test(pixelId)) return;
  if (!window.ttq) {
    const s = document.createElement("script");
    s.text = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=d.createElement("script"),n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=d.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};}(window,document,'ttq');`;
    document.head.appendChild(s);
  }
  (window.ttq as unknown as { load: (id: string) => void }).load(pixelId);
  loadedId = pixelId;
  pending.splice(0).forEach((fn) => fn());
}

/** Guarda o ttclid da página de entrada do anúncio (primeiro clique) para mandar na venda. */
export function rememberTtclid() {
  if (typeof window === "undefined") return;
  const id = new URLSearchParams(window.location.search).get("ttclid");
  if (!id) return;
  try {
    localStorage.setItem(TTCLID_KEY, id.slice(0, 500));
  } catch {
    // sem armazenamento: o pixel ainda manda o ttclid pelo navegador
  }
}

function cookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** ttclid (clique no anúncio) e _ttp (cookie do pixel), para a venda no servidor. */
export function getTiktokIds(): { ttclid?: string; ttp?: string } {
  if (typeof window === "undefined") return {};
  let ttclid: string | null = new URLSearchParams(window.location.search).get("ttclid");
  try {
    ttclid ??= localStorage.getItem(TTCLID_KEY);
  } catch {
    // sem armazenamento
  }
  const ttp = cookie("_ttp")?.slice(0, 200);
  return { ...(ttclid ? { ttclid: ttclid.slice(0, 500) } : {}), ...(ttp ? { ttp } : {}) };
}

/** PageView do TikTok (uma vez por página). */
export function tiktokPage() {
  if (!ready()) {
    pending.push(tiktokPage);
    return;
  }
  window.ttq!.page();
}

export type TiktokBrowserEvent =
  "ViewContent" | "AddToCart" | "InitiateCheckout" | "AddPaymentInfo";

export function tiktokTrack(
  event: TiktokBrowserEvent,
  data: { value?: number; contentId?: string; contentName?: string } = {},
) {
  if (typeof window === "undefined") return;
  if (!ready()) {
    pending.push(() => tiktokTrack(event, data));
    return;
  }
  const eventId = `${event}-${crypto.randomUUID()}`;
  const props =
    data.value !== undefined
      ? {
          value: data.value,
          currency: "BRL",
          content_type: "product",
          ...(data.contentId
            ? { contents: [{ content_id: data.contentId, content_name: data.contentName }] }
            : {}),
        }
      : {};
  window.ttq!.track(event, props, { event_id: eventId });
  const { ttclid, ttp } = getTiktokIds();
  void trackTiktokEvent({
    data: {
      event,
      eventId,
      url: window.location.href,
      ttclid: ttclid ?? null,
      ttp: ttp ?? null,
      value: data.value,
      contentId: data.contentId,
      contentName: data.contentName?.slice(0, 120),
    },
  }).catch(() => undefined);
}

/** Compra no navegador com o mesmo event_id usado no servidor (id do pedido). */
export function tiktokPurchaseBrowser(orderId: string, value: number) {
  if (typeof window === "undefined") return;
  if (!ready()) {
    pending.push(() => tiktokPurchaseBrowser(orderId, value));
    return;
  }
  // Uma compra por pedido neste navegador (recarregar a página não reenvia).
  const key = `tiktok-purchase-${orderId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    // sem armazenamento: o event_id igual ao do servidor ainda evita duplicar no TikTok
  }
  window.ttq!.track(
    "CompletePayment",
    { value, currency: "BRL", content_type: "product" },
    { event_id: `purchase-${orderId}` },
  );
}
