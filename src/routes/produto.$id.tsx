import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { Price, ProductCard, ProductImage } from "@/components/store/ProductCard";
import { brand } from "@/lib/brand";
import { categoryName, getProduct, PRODUCTS } from "@/lib/catalog";
import { MAX_QTY, useCart } from "@/lib/cart";
import { metaTrack } from "@/lib/meta-pixel";
import { brl, priceOf, store } from "@/lib/store-settings";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return { id: p.id };
  },
  head: ({ loaderData }) => {
    const p = loaderData ? getProduct(loaderData.id) : undefined;
    if (!p) return {};
    const title = `${p.nome} Ref. ${p.ref} | ${brand.name}`;
    return {
      meta: [
        { title },
        { name: "description", content: `${p.nome} ${p.marca}, referência ${p.ref}. ${p.descricao}` },
        { property: "og:title", content: title },
        ...(p.imagens[0] ? [{ property: "og:image", content: p.imagens[0] }] : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useLoaderData();
  const p = getProduct(id)!;
  const cart = useCart();
  const navigate = useNavigate();
  const [size, setSize] = useState<string | null>(p.tamanhos.length === 1 ? p.tamanhos[0]! : null);
  const [sizeError, setSizeError] = useState(false);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const { price } = priceOf(p);

  useEffect(() => {
    setSize(p.tamanhos.length === 1 ? p.tamanhos[0]! : null);
    setQty(1);
    setImg(0);
    metaTrack("ViewContent", { value: price, contentName: p.nome });
  }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const related = [
    ...PRODUCTS.filter((x) => x.categoria === p.categoria && x.id !== p.id),
    ...PRODUCTS.filter((x) => x.categoria !== p.categoria),
  ].slice(0, 4);

  const add = (goCheckout: boolean) => {
    if (!size) {
      setSizeError(true);
      return;
    }
    cart.add(p.id, size, qty);
    metaTrack("AddToCart", { value: price * qty, contentName: p.nome });
    if (goCheckout) navigate({ to: "/checkout" });
    else {
      toast.success(`${p.nome} adicionado à sacola`);
      cart.setOpen(true);
    }
  };

  return (
    <SiteLayout>
      <div className="container fade-in">
        <nav className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/colecao">Coleção</Link> /{" "}
          <Link to="/colecao" search={{ cat: p.categoria }}>
            {categoryName(p.categoria)}
          </Link>{" "}
          / {p.nome}
        </nav>
        <div className="pdp">
          <div className={`gallery ${p.imagens.length > 1 ? "gallery--thumbs" : ""}`}>
            <div className="gallery__main">
              <ProductImage p={p} index={img} />
            </div>
            {p.imagens.length > 1 && (
              <div className="gallery__thumbs">
                {p.imagens.map((src, i) => (
                  <button key={src} className={`thumb ${i === img ? "active" : ""}`} onClick={() => setImg(i)}>
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="pdp__ref">
              {p.marca} · REF. {p.ref}
            </div>
            <h1>{p.nome}</h1>
            <Price p={p} big />

            {p.cor && (
              <div className="opt-label">
                Cor <span>{p.cor}</span>
              </div>
            )}
            <div className="opt-label">
              Tamanho <span>{size ? `Selecionado: ${size}` : "Selecione"}</span>
            </div>
            <div className="sizes">
              {p.tamanhos.map((t) => (
                <button
                  key={t}
                  className={`size ${size === t ? "active" : ""}`}
                  onClick={() => {
                    setSize(t);
                    setSizeError(false);
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className={`size-error ${sizeError ? "show" : ""}`}>Escolha um tamanho para continuar.</div>

            <div className="opt-label">Quantidade</div>
            <div className="qty">
              <button aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                −
              </button>
              <span>{qty}</span>
              <button aria-label="Aumentar" disabled={qty >= MAX_QTY} onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}>
                +
              </button>
            </div>

            <div className="pdp__buy">
              <button className="btn btn--pink btn--block" onClick={() => add(false)}>
                Adicionar à sacola
              </button>
              <button className="btn btn--ghost btn--block" onClick={() => add(true)}>
                Comprar agora
              </button>
            </div>

            <ul className="pdp__perks">
              <li>
                <svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /></svg>
                {store.freeShippingMin > 0
                  ? `Frete grátis acima de ${brl(store.freeShippingMin)}`
                  : "Entrega para todo o Brasil"}
              </li>
              <li>
                <svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /></svg>
                7 dias para trocar ou devolver
              </li>
            </ul>

            <div className="details">
              <details open>
                <summary>Descrição</summary>
                <p>{p.descricao}</p>
              </details>
              <details>
                <summary>Características</summary>
                <table>
                  <tbody>
                    <tr><td>Marca</td><td>{p.marca}</td></tr>
                    <tr><td>Referência</td><td>{p.ref}</td></tr>
                    <tr><td>Categoria</td><td>{categoryName(p.categoria)}</td></tr>
                    {p.cor && <tr><td>Cor</td><td>{p.cor}</td></tr>}
                    <tr><td>Numeração</td><td>{p.tamanhos.join(", ")}</td></tr>
                  </tbody>
                </table>
              </details>
              <details>
                <summary>Trocas e devoluções</summary>
                <p>
                  Você tem 7 dias após o recebimento para desistir da compra, como garante o Código de Defesa
                  do Consumidor. Veja a <Link to="/politica-reembolso">política de trocas</Link>.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
      <section className="section section--cream">
        <div className="container">
          <div className="section-title">
            <h2>você também vai amar</h2>
            <Link to="/colecao">Ver tudo</Link>
          </div>
          <div className="grid">
            {related.map((x) => (
              <ProductCard key={x.id} p={x} />
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
