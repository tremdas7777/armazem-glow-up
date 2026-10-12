import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Check, Copy, Loader2, PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { createProtecaoCharge, getPixStatus } from "@/lib/pix.functions";
import { loadProtecao, saveProtecao, type ProtecaoSession } from "@/lib/pix-session";
import { PROTECAO } from "@/lib/order-protection";
import { brand } from "@/lib/brand";
import { brl } from "@/components/checkout/parts";
import { Pill, Shell } from "@/components/checkout/OrderShell";

export const Route = createFileRoute("/protecao/$id")({
  head: () => ({
    meta: [{ title: `Proteja seu pedido | ${brand.name}` }, { name: "robots", content: "noindex" }],
  }),
  component: Page,
});

/** Upsell pós-compra: o pedido já está pago; aqui o cliente pode proteger o envio com um Pix à parte. */
function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const done = () => navigate({ to: "/obrigado/$id", params: { id }, replace: true });
  // Lido só no navegador para não divergir da renderização do servidor.
  const [prot, setProt] = useState<ProtecaoSession | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const p = loadProtecao(id);
    if (p?.paid) done();
    else setProt(p);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const createFn = useServerFn(createProtecaoCharge);
  const accept = useMutation({
    mutationFn: () => createFn({ data: { parentId: id, origin: window.location.origin } }),
    onSuccess: (c) => {
      const p = { id: c.id, qrcode: c.qrcode, amount: c.amount, createdAt: Date.now() };
      saveProtecao(id, p);
      setProt(p);
    },
  });

  if (!ready)
    return (
      <Shell>
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--ck-ok)]" />
        </div>
      </Shell>
    );
  if (prot) return <ProtecaoPix parentId={id} prot={prot} onPaid={done} onSkip={done} />;

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <Pill variant="approved" />
        <h1 className="mt-5 text-[26px] font-bold tracking-tight">Pagamento confirmado!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Antes de finalizar, uma última oferta:</p>

        <div className="mt-6 rounded-xl border-2 border-dashed border-[var(--ck-green)] bg-[var(--ck-badge)]/40 p-6 text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--ck-green)] text-white">
              <ShieldCheck className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-[18px] font-bold leading-tight">{PROTECAO.nome}</h2>
              <p className="text-[13px] text-muted-foreground">
                Por apenas{" "}
                <b className="text-[15px] text-[var(--ck-green)]">
                  {brl(PROTECAO.priceCents / 100)}
                </b>
              </p>
            </div>
          </div>
          <p className="mt-4 text-[14px]">{PROTECAO.promessa}</p>
          <ul className="mt-4 space-y-2 text-[13px]">
            {[
              { icon: Truck, text: "Reenvio prioritário em caso de extravio ou roubo" },
              { icon: PackageCheck, text: "Chegou danificado? Mandamos outro, sem burocracia" },
              { icon: Check, text: "Ou, se preferir, o seu dinheiro de volta" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[var(--ck-green)]" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {accept.isError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            Não foi possível gerar o Pix da proteção agora. Tente de novo em instantes.
          </p>
        )}
        <button
          type="button"
          disabled={accept.isPending}
          onClick={() => accept.mutate()}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ck-green)] px-6 py-4 text-[16px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {accept.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Sim, quero proteger meu pedido
        </button>
        <button
          type="button"
          onClick={done}
          className="mt-3 text-[13px] text-muted-foreground underline"
        >
          Não, obrigado. Seguir sem proteção
        </button>
      </div>
    </Shell>
  );
}

/** Pix da proteção: copia e cola + consulta até cair; pago, segue para a confirmação. */
function ProtecaoPix({
  parentId,
  prot,
  onPaid,
  onSkip,
}: {
  parentId: string;
  prot: ProtecaoSession;
  onPaid: () => void;
  onSkip: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const statusFn = useServerFn(getPixStatus);
  const { data } = useQuery({
    queryKey: ["pix-status", prot.id],
    queryFn: () => statusFn({ data: { id: prot.id } }),
    refetchInterval: (q) => (q.state.data?.paid ? false : 5000),
  });
  useEffect(() => {
    if (!data?.paid) return;
    saveProtecao(parentId, { ...prot, paid: true });
    onPaid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.paid]);

  const copy = async () => {
    await navigator.clipboard.writeText(prot.qrcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Shell>
      <div className="mx-auto max-w-[560px] px-4 pb-20 text-center">
        <Pill variant="waiting" />
        <h1 className="mt-5 text-[24px] font-bold tracking-tight">Falta só o Pix da proteção</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Seu pedido já está pago. Pague{" "}
          <b className="text-[var(--ck-ok)]">{brl(prot.amount / 100)}</b> para ativar a{" "}
          {PROTECAO.nome.toLowerCase()}.
        </p>
        <div className="mt-6 break-all rounded-lg bg-muted px-4 py-3 text-left text-[12px] text-muted-foreground">
          {prot.qrcode}
        </div>
        <button
          type="button"
          onClick={copy}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ck-green)] px-6 py-3.5 text-[15px] font-semibold text-white transition hover:opacity-90"
        >
          <Copy className="h-4 w-4" /> {copied ? "Código copiado!" : "Copiar código"}
        </button>
        <p className="mt-4 flex items-center justify-center gap-2 text-[13px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aguardando o pagamento…
        </p>
        <button
          type="button"
          onClick={onSkip}
          className="mt-6 text-[13px] text-muted-foreground underline"
        >
          Seguir sem proteção
        </button>
      </div>
    </Shell>
  );
}
