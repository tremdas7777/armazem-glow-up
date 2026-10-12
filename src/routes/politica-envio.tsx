import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
import { brand } from "@/lib/brand";
import { brl, store } from "@/lib/store-settings";
import { PROTECAO } from "@/lib/order-protection";

export const Route = createFileRoute("/politica-envio")({
  head: () => ({
    meta: [
      {
        property: "og:description",
        content: "Como funciona o envio dos pedidos, prazos e rastreamento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        {store.shipping.padrao.freeFrom > 0 ? (
          <>
            <li>
              Frete Grátis, em pedidos a partir de {brl(store.shipping.padrao.freeFrom)}:{" "}
              {store.shipping.padrao.eta} após a postagem.
            </li>
            <li>
              Frete Padrão, em pedidos abaixo de {brl(store.shipping.padrao.freeFrom)}:{" "}
              {brl(store.shipping.padrao.price)}, {store.shipping.padrao.eta} após a postagem.
            </li>
          </>
        ) : (
          <li>Frete Grátis, em todos os pedidos: {store.shipping.padrao.eta} após a postagem.</li>
        )}
        <li>
          Frete Rápido: {brl(store.shipping.rapido.price)}, {store.shipping.rapido.eta} após a
          postagem.
        </li>
        <li>
          Frete Express: {brl(store.shipping.express.price)}, {store.shipping.express.eta} após a
          postagem.
        </li>
      </ul>
      <p>
        O valor e o prazo do frete aparecem no checkout, antes do pagamento. Não cobramos nada
        depois.
      </p>
      <h2>{PROTECAO.nome}</h2>
      <p>
        Opcional, oferecida após a confirmação do pagamento, por {brl(PROTECAO.priceCents / 100)}.{" "}
        {PROTECAO.promessa}
      </p>
      <h2>Rastreamento</h2>
      <p>
        Assim que o pedido for postado, o código de rastreio aparece em{" "}
        <Link to="/rastreio">Rastrear pedido</Link>, consultado pelo CPF usado na compra.
      </p>
    </PolicyPage>
  ),
});
