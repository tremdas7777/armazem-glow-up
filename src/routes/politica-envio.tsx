import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
import { brand } from "@/lib/brand";
import { brl, store } from "@/lib/store-settings";

export const Route = createFileRoute("/politica-envio")({
  head: () => ({
    meta: [
      { title: `Envio e Prazos | ${brand.name}` },
      { name: "description", content: "Como funciona o envio dos pedidos, prazos e rastreamento." },
      { property: "og:title", content: "Envio e Prazos" },
      { property: "og:url", content: "/politica-envio" },
    ],
    links: [{ rel: "canonical", href: "/politica-envio" }],
  }),
  component: () => (
    <PolicyPage title="Envio e Prazos" intro="Enviamos para todo o Brasil, com código de rastreio.">
      <h2>Quando o pedido é enviado</h2>
      <p>O pedido é separado assim que o Pix é confirmado e postado em até 2 dias úteis.</p>
      <h2>Opções de frete</h2>
      <ul>
        <li>
          Frete Padrão: {brl(store.shipping.padrao.price)}, {store.shipping.padrao.eta} após a postagem.
        </li>
        <li>
          Frete Express: {brl(store.shipping.express.price)}, {store.shipping.express.eta} após a postagem.
        </li>
        {store.freeShippingMin > 0 && (
          <li>Frete grátis (padrão) em compras a partir de {brl(store.freeShippingMin)} em produtos.</li>
        )}
      </ul>
      <p>O valor e o prazo do frete aparecem no checkout, antes do pagamento. Não cobramos nada depois.</p>
      <h2>Rastreamento</h2>
      <p>
        Assim que o pedido for postado, o código de rastreio aparece em{" "}
        <Link to="/rastreio">Rastrear pedido</Link>, consultado pelo CPF usado na compra.
      </p>
    </PolicyPage>
  ),
});
