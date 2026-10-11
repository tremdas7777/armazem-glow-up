import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { SiteLayout } from "@/components/site/Layout";
import { ProductArt, ProductCard } from "@/components/store/ProductCard";
import { brand } from "@/lib/brand";
import { CATEGORIAS, categoriesWithProducts, PRODUCTS, type Produto } from "@/lib/catalog";
import { brl, priceOf, store } from "@/lib/store-settings";

const TITLE = `${brand.name} | Sandálias, chinelos, tênis e mais`;
const DESCRIPTION = `Calçados femininos de várias marcas: sandálias, chinelos, tamancos, sapatilhas, tênis e bolsas. Pagamento seguro no Pix e entrega para todo o Brasil.`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const count = (slug: string) => PRODUCTS.filter((p) => p.categoria === slug).length;

/** Lançamentos intercalando as categorias, para a vitrine não ficar só com um tipo. */
function newArrivals(): Produto[] {
  const groups = CATEGORIAS.map((c) => PRODUCTS.filter((p) => p.novo && p.categoria === c.slug));
  const out: Produto[] = [];
  for (let i = 0; groups.some((g) => g[i]); i++) groups.forEach((g) => g[i] && out.push(g[i]!));
  return out;
}

function Shelf({
  title,
  sub,
  items,
  link,
}: {
  title: string;
  sub?: string;
  items: Produto[];
  link: { search: Record<string, string> };
}) {
  const ref = useRef<HTMLDivElement>(null);
  if (!items.length) return null;
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: ref.current.clientWidth * 0.9 * dir, behavior: "smooth" });
  return (
    <section className="section" style={{ paddingBottom: 40 }}>
      <div className="container">
        <div className="section-title">
          <div>
            <h2>{title}</h2>
            {sub && <p>{sub}</p>}
          </div>
          <div className="section-title__right">
            <Link to="/colecao" search={link.search}>
              Ver tudo
            </Link>
            <div className="shelf-nav">
              <button aria-label="Anterior" onClick={() => scroll(-1)}>
                <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg>
              </button>
              <button aria-label="Próximo" onClick={() => scroll(1)}>
                <svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
        <div className="shelf-wrap">
          <div className="shelf" ref={ref}>
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryTabs() {
  const cats = categoriesWithProducts();
  const [tab, setTab] = useState(cats[0]?.slug ?? "");
  if (!cats.length) return null;
  const items = PRODUCTS.filter((p) => p.categoria === tab).slice(0, 8);
  const nome = cats.find((c) => c.slug === tab)?.nome ?? "";
  return (
    <section className="section section--cream">
      <div className="container">
        <div className="section-title">
          <div>
            <h2>explore a coleção</h2>
            <p>Escolha uma categoria e veja os modelos</p>
          </div>
        </div>
        <div className="tabs">
          {cats.map((c) => (
            <button key={c.slug} className={`tab ${tab === c.slug ? "active" : ""}`} onClick={() => setTab(c.slug)}>
              {c.nome}
            </button>
          ))}
        </div>
        <div className="tab-panel">
          <div className="grid fade-in" key={tab}>
            {items.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          <div className="tab-more">
            <Link className="btn btn--pink" to="/colecao" search={{ cat: tab }}>
              Ver todos em {nome} ({count(tab)})
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const PERKS = [
  {
    t: "Frete grátis",
    s: () => (store.freeShippingMin > 0 ? `Acima de ${brl(store.freeShippingMin)}` : "Para todo o Brasil"),
    d: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></>,
  },
  { t: "Pix na hora", s: () => "Pedido separado assim que paga", d: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></> },
  { t: "Troca fácil", s: () => "7 dias para devolver", d: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M20 4v5h-5M4 20v-5h5" /></> },
  { t: "Compra segura", s: () => `CNPJ ${brand.company.cnpj}`, d: <><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></> },
];

function Index() {
  const cats = categoriesWithProducts();
  const novos = newArrivals();
  const ofertas = PRODUCTS.filter((p) => priceOf(p).off > 0);
  const maxOff = Math.max(0, ...ofertas.map((p) => priceOf(p).off));
  const menor = Math.min(...PRODUCTS.map((p) => priceOf(p).price));
  const vendidos = PRODUCTS.filter((p) => p.maisVendido);
  const grandes = [...cats].sort((a, b) => count(b.slug) - count(a.slug)).slice(0, 2);
  const picks = cats.slice(0, 3).map((c) => novos.find((p) => p.categoria === c.slug) ?? PRODUCTS.find((p) => p.categoria === c.slug)!);
  const marcas = [...new Set(PRODUCTS.map((p) => p.marca))];

  return (
    <SiteLayout>
      <section className="hero2 sequins">
        <div className="hero2__inner">
          <div>
            <span className="hero__eyebrow">
              {store.discountPct > 0 ? `${store.discountPct}% OFF em toda a loja` : "Nova coleção"}
            </span>
            <h1>
              {store.discountPct > 0 ? (
                <>
                  tudo com <em>{store.discountPct}% off</em>
                </>
              ) : (
                <>
                  mais que um <em>sapato</em>
                </>
              )}
            </h1>
            <p>Calçados de várias marcas, com cor, conforto e personalidade para cada passo.</p>
            <div className="hero__ctas">
              <Link to="/colecao" search={store.discountPct ? {} : { novo: "1" }} className="btn btn--yellow">
                {store.discountPct ? "Aproveitar agora" : "Ver lançamentos"}
              </Link>
              <Link to="/colecao" className="btn btn--outline">
                Toda a coleção
              </Link>
            </div>
            <div className="hero2__stats">
              <div><strong>{PRODUCTS.length}</strong>modelos</div>
              <div><strong>{marcas.length}</strong>{marcas.length === 1 ? "marca" : "marcas"}</div>
              <div><strong>{cats.length}</strong>categorias</div>
            </div>
          </div>
          <div className="hero2__collage" aria-hidden="true">
            {picks.map((p, i) => (
              <Link key={p.id} to="/produto/$id" params={{ id: p.id }} className={`blob b${i + 1}`}>
                {p.imagens[0] ? <img src={p.imagens[0]} alt="" /> : <ProductArt cor={p.cor} />}
              </Link>
            ))}
            <div className="price-tag">
              a partir de<strong>{brl(menor)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ padding: "40px 0 8px" }}>
        <div className="container">
          <div className="section-title" style={{ marginBottom: 20 }}>
            <h2>compre por categoria</h2>
            <Link to="/colecao">Ver tudo</Link>
          </div>
          <div className="cat-circles">
            {cats.map((c) => {
              const cover = PRODUCTS.find((p) => p.categoria === c.slug && p.imagens[0]);
              return (
                <Link key={c.slug} className="cat-circle" to="/colecao" search={{ cat: c.slug }}>
                  <div className="cat-circle__img">
                    {cover ? (
                      <img src={cover.imagens[0]} alt="" style={{ borderRadius: "50%", width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <ProductArt />
                    )}
                  </div>
                  <strong>{c.nome}</strong>
                  <small>{count(c.slug)} modelos</small>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <Shelf title="lançamentos" sub="Acabaram de chegar" items={novos} link={{ search: { novo: "1" } }} />

      <section className="section" style={{ padding: "24px 0" }}>
        <div className="container banners">
          <Link
            to="/colecao"
            search={maxOff ? { oferta: "1" } : { ate: "100", ordem: "menor" }}
            className="banner banner--yellow"
          >
            <h3>{maxOff ? `ofertas até ${maxOff}% off` : `a partir de ${brl(menor)}`}</h3>
            <p>{maxOff ? "Preços especiais em toda a loja." : "Modelos lindos que cabem no bolso."}</p>
            <span className="btn btn--pink">{maxOff ? "Aproveitar" : "Ver até R$ 100"}</span>
          </Link>
          <Link to="/colecao" search={{ cat: "bolsas" }} className="banner banner--plum">
            <h3>complete o look</h3>
            <p>Bolsas que combinam com todos os seus pares.</p>
            <span className="btn btn--yellow">Ver bolsas</span>
          </Link>
        </div>
      </section>

      {vendidos.length ? (
        <Shelf title="mais vendidos" sub="Os favoritos de quem já comprou" items={vendidos} link={{ search: { ordem: "vendidos" } }} />
      ) : (
        grandes.map((c) => (
          <Shelf
            key={c.slug}
            title={c.nome.toLowerCase()}
            sub={`${count(c.slug)} modelos para escolher`}
            items={PRODUCTS.filter((p) => p.categoria === c.slug).slice(0, 12)}
            link={{ search: { cat: c.slug } }}
          />
        ))
      )}

      <CategoryTabs />

      <div className="container">
        <div className="perks">
          {PERKS.map((k) => (
            <div className="perk" key={k.t}>
              <div className="perk__icon">
                <svg viewBox="0 0 24 24">{k.d}</svg>
              </div>
              <div>
                <strong>{k.t}</strong>
                <span>{k.s()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}
