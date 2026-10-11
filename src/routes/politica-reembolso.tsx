import { createFileRoute, Link } from "@tanstack/react-router";
import { PolicyPage } from "@/components/site/PolicyPage";
import { brand } from "@/lib/brand";

const contato = () =>
  brand.email
    ? `pelo e-mail ${brand.email}`
    : brand.whatsapp.display
      ? `pelo WhatsApp ${brand.whatsapp.display}`
      : "pela página de contato";

export const Route = createFileRoute("/politica-reembolso")({
  head: () => ({
    meta: [
      { title: `Trocas e Devoluções | ${brand.name}` },
      { name: "description", content: `Como trocar ou devolver um produto comprado na ${brand.name}.` },
      { property: "og:title", content: "Trocas e Devoluções" },
      { property: "og:url", content: "/politica-reembolso" },
    ],
    links: [{ rel: "canonical", href: "/politica-reembolso" }],
  }),
  component: () => (
    <PolicyPage
      title="Trocas e Devoluções"
      intro="Comprar online tem que ser tranquilo. Aqui estão as regras para trocar ou devolver um produto, conforme o Código de Defesa do Consumidor."
    >
      <h2>Direito de arrependimento (7 dias)</h2>
      <p>
        Você pode desistir da compra em até 7 dias corridos após receber o produto, sem precisar
        justificar (art. 49 do CDC). Devolvemos o valor integral pago, incluindo o frete.
      </p>
      <h2>Troca de tamanho ou modelo</h2>
      <p>
        Dentro do mesmo prazo, você pode pedir a troca por outro tamanho ou modelo, de acordo com a
        disponibilidade em estoque. Se o novo produto tiver outro valor, a diferença é acertada no
        atendimento.
      </p>
      <h2>Produto com defeito</h2>
      <p>
        Produtos com defeito de fabricação podem ser trocados em até 90 dias após o recebimento (art.
        26 do CDC). Nesse caso, o frete de envio e de retorno fica por nossa conta.
      </p>
      <h2>Condições</h2>
      <ul>
        <li>O produto deve voltar sem sinais de uso, com etiquetas e na embalagem original.</li>
        <li>Guarde o número do pedido: ele aparece na página de confirmação e no Pix.</li>
      </ul>
      <h2>Como solicitar</h2>
      <p>
        Fale com a gente {contato()} informando o número do pedido e o motivo. Também dá para usar a{" "}
        <Link to="/contato">página de contato</Link>.
      </p>
      <h2>Reembolso</h2>
      <p>
        O reembolso é feito por Pix, na conta indicada por você, em até 7 dias úteis após recebermos o
        produto de volta.
      </p>
      <p>
        {brand.company.legalName} · CNPJ {brand.company.cnpj} · {brand.company.address}
      </p>
    </PolicyPage>
  ),
});
