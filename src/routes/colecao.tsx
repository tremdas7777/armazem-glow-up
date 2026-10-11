import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { SiteLayout } from "@/components/site/Layout";
import { ProductCard } from "@/components/store/ProductCard";
import { brand } from "@/lib/brand";
import { brands, CATEGORIAS, categoryName, PRODUCTS } from "@/lib/catalog";
import { brl, priceOf } from "@/lib/store-settings";

const searchSchema = z.object({
  cat: z.string().max(40).optional(),
  marca: z.string().max(60).optional(),
  q: z.string().max(80).optional(),
  novo: z.string().max(1).optional(),
  oferta: z.string().max(1).optional(),
  tam: z.string().max(10).optional(),
  ate: z.string().max(6).optional(),
  ordem: z.enum(["menor", "maior", "az", "desconto", "vendidos"]).optional(),
});
type Search = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/colecao")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Coleção | ${brand.name}` },
      { name: "description", content: `Todos os calçados da ${brand.name}: filtre por categoria, marca, tamanho e preço.` },
    ],
  }),
  component: Catalog,
});

const PAGE = 24;
const FAIXAS = [100, 150, 200, 300];
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[.\s-]/g, "");

function Catalog() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/colecao" });
  const [shown, setShown] = useState(PAGE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const ate = Number(s.ate) || 0;

  const base = PRODUCTS.filter(
    (p) =>
      (!s.q || norm(`${p.nome}${p.ref}${p.marca}${categoryName(p.categoria)}`).includes(norm(s.q))) &&
      (!s.novo || p.novo) &&
      (!s.oferta || priceOf(p).off > 0),
  );
  let list = base.filter(
    (p) =>
      (!s.cat || p.categoria === s.cat) &&
      (!s.marca || p.marca === s.marca) &&
      (!s.tam || p.tamanhos.includes(s.tam)) &&
      (!ate || priceOf(p).price <= ate),
  );
  const by = (f: (a: (typeof list)[number], b: (typeof list)[number]) => number) => (list = [...list].sort(f));
  if (s.ordem === "menor") by((a, b) => priceOf(a).price - priceOf(b).price);
  if (s.ordem === "maior") by((a, b) => priceOf(b).price - priceOf(a).price);
  if (s.ordem === "az") by((a, b) => a.nome.localeCompare(b.nome));
  if (s.ordem === "desconto") by((a, b) => priceOf(b).off - priceOf(a).off);
  if (s.ordem === "vendidos") by((a, b) => Number(!!b.maisVendido) - Number(!!a.maisVendido));

  const title = s.q ? "Busca" : s.novo ? "Lançamentos" : s.oferta ? "Ofertas" : s.cat ? categoryName(s.cat) : s.marca ?? "Coleção";
  const go = (patch: Partial<Search>) => {
    setShown(PAGE);
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };
  const sizes = [...new Set(PRODUCTS.flatMap((p) => p.tamanhos))].sort((a, b) => (Number(a) || 999) - (Number(b) || 999));
  const allBrands = brands();
  const hasOffers = PRODUCTS.some((p) => priceOf(p).off > 0);
  const chips: [string, Partial<Search>][] = [
    ...(s.cat ? [[categoryName(s.cat), { cat: undefined }] as [string, Partial<Search>]] : []),
    ...(s.marca ? [[s.marca, { marca: undefined }] as [string, Partial<Search>]] : []),
    ...(s.tam ? [[`Tam. ${s.tam}`, { tam: undefined }] as [string, Partial<Search>]] : []),
    ...(ate ? [[`Até ${brl(ate)}`, { ate: undefined }] as [string, Partial<Search>]] : []),
    ...(s.novo ? [["Lançamentos", { novo: undefined }] as [string, Partial<Search>]] : []),
    ...(s.oferta ? [["Ofertas", { oferta: undefined }] as [string, Partial<Search>]] : []),
    ...(s.q ? [[`“${s.q}”`, { q: undefined }] as [string, Partial<Search>]] : []),
  ];

  return (
    <SiteLayout>
      <section className="page-hero page-hero--sm sequins">
        <h1>{title}</h1>
        {s.q && <p>Resultados para “{s.q}”</p>}
      </section>
      <div className="container">
        <nav className="breadcrumb" style={{ paddingBottom: 0 }}>
          <Link to="/">Home</Link> / <Link to="/colecao">Coleção</Link>
          {s.cat && <> / {categoryName(s.cat)}</>}
        </nav>
        <div className="catalog">
          <aside className={`filters ${filtersOpen ? "open" : ""}`}>
            <div className="filters__head">
              <h3>Filtrar</h3>
              <button className="icon-btn" aria-label="Fechar" style={{ color: "var(--plum)" }} onClick={() => setFiltersOpen(false)}>
                <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <section>
              <h4>Categorias</h4>
              <ul>
                <li>
                  <button className={!s.cat ? "active" : ""} onClick={() => go({ cat: undefined })}>
                    Todas <span>{base.length}</span>
                  </button>
                </li>
                {CATEGORIAS.map((c) => {
                  const n = base.filter((p) => p.categoria === c.slug).length;
                  return n ? (
                    <li key={c.slug}>
                      <button className={s.cat === c.slug ? "active" : ""} onClick={() => go({ cat: c.slug })}>
                        {c.nome} <span>{n}</span>
                      </button>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
            {allBrands.length > 1 && (
              <section>
                <h4>Marca</h4>
                <ul>
                  <li>
                    <button className={!s.marca ? "active" : ""} onClick={() => go({ marca: undefined })}>
                      Todas
                    </button>
                  </li>
                  {allBrands.map((m) => (
                    <li key={m}>
                      <button className={s.marca === m ? "active" : ""} onClick={() => go({ marca: m })}>
                        {m} <span>{base.filter((p) => p.marca === m).length}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <section>
              <h4>Tamanho</h4>
              <div className="sizes">
                {sizes.map((t) => (
                  <button key={t} className={`size ${s.tam === t ? "active" : ""}`} onClick={() => go({ tam: s.tam === t ? undefined : t })}>
                    {t}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h4>Preço</h4>
              <ul>
                <li>
                  <button className={!ate ? "active" : ""} onClick={() => go({ ate: undefined })}>
                    Qualquer preço
                  </button>
                </li>
                {FAIXAS.map((f) => (
                  <li key={f}>
                    <button className={ate === f ? "active" : ""} onClick={() => go({ ate: String(f) })}>
                      Até {brl(f)}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section style={{ border: 0 }}>
              <h4>Mostrar</h4>
              <label className="toggle-row">
                <input type="checkbox" checked={!!s.novo} onChange={(e) => go({ novo: e.target.checked ? "1" : undefined })} /> Só lançamentos
              </label>
              {hasOffers && (
                <label className="toggle-row">
                  <input type="checkbox" checked={!!s.oferta} onChange={(e) => go({ oferta: e.target.checked ? "1" : undefined })} /> Só ofertas
                </label>
              )}
            </section>
          </aside>
          <div className={`overlay ${filtersOpen ? "show" : ""}`} onClick={() => setFiltersOpen(false)} />
          <div>
            <div className="catalog__top">
              <p className="results-info">
                {list.length} {list.length === 1 ? "produto" : "produtos"}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn--ghost filter-open" onClick={() => setFiltersOpen(true)}>
                  Filtrar{chips.length ? ` (${chips.length})` : ""}
                </button>
                <select
                  className="select"
                  aria-label="Ordenar"
                  value={s.ordem ?? ""}
                  onChange={(e) => go({ ordem: (e.target.value || undefined) as Search["ordem"] })}
                >
                  <option value="">Mais relevantes</option>
                  {PRODUCTS.some((p) => p.maisVendido) && <option value="vendidos">Mais vendidos</option>}
                  <option value="menor">Menor preço</option>
                  <option value="maior">Maior preço</option>
                  {hasOffers && <option value="desconto">Maior desconto</option>}
                  <option value="az">A–Z</option>
                </select>
              </div>
            </div>
            {chips.length > 0 && (
              <div className="active-filters">
                {chips.map(([t, patch]) => (
                  <button key={t} onClick={() => go(patch)}>
                    {t}
                  </button>
                ))}
                {chips.length > 1 && (
                  <Link to="/colecao" style={{ background: "none", textDecoration: "underline" }}>
                    Limpar tudo
                  </Link>
                )}
              </div>
            )}
            {list.length ? (
              <>
                <div className="grid">
                  {list.slice(0, shown).map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
                {list.length > shown && (
                  <div className="tab-more">
                    <p className="results-info">
                      Mostrando {shown} de {list.length}
                    </p>
                    <button className="btn btn--pink" onClick={() => setShown((v) => v + PAGE)}>
                      Carregar mais
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty">
                <h3>Nada por aqui</h3>
                <p>Nenhum produto com esses filtros.</p>
                <br />
                <Link className="btn btn--pink" to="/colecao">
                  Limpar filtros
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
