import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PRODUCTS } from "@/lib/catalog";
import { getStoreConfig, resetStoreConfig, saveStoreConfig } from "@/lib/store-settings.functions";
import { brl, storeConfigSchema, type StoreConfig } from "@/lib/store-settings";

type Draft = {
  discountPct: string;
  padraoEta: string;
  padraoPrice: string;
  freeFrom: string;
  rapidoPrice: string;
  rapidoEta: string;
  expressPrice: string;
  expressEta: string;
};

const toDraft = (c: StoreConfig): Draft => ({
  discountPct: String(c.discountPct),
  padraoEta: c.shipping.padrao.eta,
  padraoPrice: String(c.shipping.padrao.price).replace(".", ","),
  freeFrom: String(c.shipping.padrao.freeFrom).replace(".", ","),
  rapidoPrice: String(c.shipping.rapido.price).replace(".", ","),
  rapidoEta: c.shipping.rapido.eta,
  expressPrice: String(c.shipping.express.price).replace(".", ","),
  expressEta: c.shipping.express.eta,
});
const num = (v: string) => Number(v.replace(/\./g, "").replace(",", "."));

/** /admin → Loja: desconto geral e frete. Vale na hora para a loja, o checkout e as cobranças. */
export function StoreTab({ password }: { password: string }) {
  const getFn = useServerFn(getStoreConfig);
  const saveFn = useServerFn(saveStoreConfig);
  const resetFn = useServerFn(resetStoreConfig);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    getFn()
      .then((c) => setDraft(toDraft(c)))
      .catch(() => setMsg("Não foi possível carregar."));
  }, [getFn]);

  if (!draft) return <p className="text-sm text-muted-foreground">{msg ?? "Carregando…"}</p>;

  const config = {
    discountPct: Math.round(num(draft.discountPct)),
    shipping: {
      padrao: {
        eta: draft.padraoEta,
        price: num(draft.padraoPrice),
        freeFrom: num(draft.freeFrom),
      },
      rapido: { price: num(draft.rapidoPrice), eta: draft.rapidoEta },
      express: { price: num(draft.expressPrice), eta: draft.expressEta },
    },
  };
  const parsed = storeConfigSchema.safeParse(config);
  const sample = PRODUCTS[0];

  const save = async () => {
    if (!parsed.success) return;
    setBusy(true);
    setMsg(null);
    try {
      const c = await saveFn({ data: { password, config: parsed.data } });
      setDraft(toDraft(c));
      setMsg("Salvo. A loja já está usando os novos valores.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Falhou ao salvar.");
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    setBusy(true);
    try {
      setDraft(toDraft(await resetFn({ data: { password } })));
      setMsg("Voltou para a configuração padrão.");
    } catch {
      setMsg("Falhou ao restaurar.");
    } finally {
      setBusy(false);
    }
  };
  const field = (k: keyof Draft, label: string, hint?: string) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      <Input value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );

  return (
    <Card className="p-5 flex flex-col gap-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Store className="w-5 h-5 text-muted-foreground" aria-hidden />
        <div>
          <div className="font-medium">Desconto e frete</div>
          <div className="text-xs text-muted-foreground">
            O servidor relê estes valores antes de cada Pix: o valor cobrado é sempre o daqui.
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field(
          "discountPct",
          "Desconto em toda a loja (%)",
          sample && parsed.success
            ? `Ex.: ${sample.nome} de ${brl(sample.preco)} sai por ${brl(
                Math.round(sample.preco * (100 - parsed.data.discountPct)) / 100,
              )}. 0 = sem desconto.`
            : "0 = sem desconto.",
        )}
        {field(
          "freeFrom",
          "Frete grátis a partir de (R$)",
          "Valor dos produtos, já com desconto. 0 = grátis em todo pedido.",
        )}
        {field("padraoPrice", "Frete Padrão abaixo desse valor (R$)")}
        {field("padraoEta", "Prazo do Frete Grátis / Padrão")}
        {field("rapidoPrice", "Frete Rápido (R$)")}
        {field("rapidoEta", "Prazo do Frete Rápido")}
        {field("expressPrice", "Frete Express (R$)")}
        {field("expressEta", "Prazo do Frete Express")}
      </div>
      {!parsed.success && (
        <p className="text-xs text-destructive">
          Confira os valores: algum campo está vazio ou fora do limite.
        </p>
      )}
      <div className="flex gap-2">
        <Button onClick={save} disabled={busy || !parsed.success}>
          {busy ? "Salvando…" : "Salvar"}
        </Button>
        <Button variant="outline" onClick={reset} disabled={busy}>
          Voltar ao padrão
        </Button>
      </div>
      {msg && <p className="text-sm">{msg}</p>}
      <p className="text-xs text-muted-foreground">
        Produtos, preços de tabela, tamanhos e custos ficam em <code>src/lib/catalog-data.ts</code>{" "}
        ({PRODUCTS.length} ativos).
      </p>
    </Card>
  );
}
