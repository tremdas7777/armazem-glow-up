import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { brand } from "@/lib/brand";
import { brands } from "@/lib/catalog";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: `Sobre a ${brand.name}` },
      { name: "description", content: `Conheça a ${brand.name}, loja multimarcas de calçados femininos.` },
      { property: "og:title", content: `Sobre a ${brand.name}` },
      { property: "og:url", content: "/sobre" },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: Page,
});

function Page() {
  const c = brand.company;
  return (
    <SiteLayout>
      <section className="page-hero page-hero--sm sequins">
        <h1>A loja</h1>
      </section>
      <section className="section">
        <div className="container prose">
          <h2>Quem somos</h2>
          <p>
            A {brand.name} é uma loja multimarcas de calçados femininos: sandálias, chinelos,
            tamancos, sapatilhas, tênis e bolsas, escolhidos para quem gosta de conforto com
            personalidade.
          </p>
          <p>Marcas na loja: {brands().join(", ")}.</p>
          <h2>Compra segura</h2>
          <p>
            Você vê o preço, o frete e o prazo antes de pagar, recebe o código de rastreio quando o
            pedido é postado e tem 7 dias para desistir da compra. Veja a{" "}
            <Link to="/politica-reembolso">política de trocas</Link> e a{" "}
            <Link to="/politica-envio">política de envio</Link>.
          </p>
          <h2>Dados da empresa</h2>
          <ul>
            <li>Razão social: {c.legalName}</li>
            <li>CNPJ: {c.cnpj}</li>
            <li>Endereço: {c.address}</li>
          </ul>
        </div>
      </section>
    </SiteLayout>
  );
}
