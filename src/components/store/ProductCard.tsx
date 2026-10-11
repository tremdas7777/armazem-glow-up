import { Link } from "@tanstack/react-router";
import type { Produto } from "@/lib/catalog";
import { brl, priceOf } from "@/lib/store-settings";

const COLORS: Record<string, string> = {
  caramelo: "#c98a52",
  preto: "#2b1a24",
  branco: "#f4efe9",
  "café": "#6b3e26",
  nude: "#e3b9a0",
  rosa: "#e57aa5",
  "off-white": "#efe6da",
  dourado: "#d4a72c",
};

/** Desenho de reserva para produto sem foto. */
export function ProductArt({ cor }: { cor?: string | undefined }) {
  const fill = COLORS[(cor ?? "").toLowerCase()] ?? "#d63a7a";
  return (
    <div className="ph">
      <svg viewBox="0 0 200 130" aria-hidden="true">
        <ellipse cx="100" cy="118" rx="88" ry="7" fill="#000" opacity=".08" />
        <g fill={fill} stroke={fill} strokeWidth="1.5" strokeLinejoin="round">
          <path d="M14 88c6-22 50-28 88-26 44 2 74 10 84 26v8H14z" />
          <path d="M14 94h172v6a5 5 0 0 1-5 5H19a5 5 0 0 1-5-5z" opacity=".85" />
        </g>
      </svg>
    </div>
  );
}

export function ProductImage({ p, index = 0 }: { p: Produto; index?: number }) {
  const src = p.imagens[index];
  return src ? <img src={src} alt={p.nome} loading="lazy" /> : <ProductArt cor={p.cor} />;
}

export function Price({ p, big = false }: { p: Produto; big?: boolean }) {
  const { price, compareAt } = priceOf(p);
  return (
    <div className={big ? "pdp__price" : "card__price"}>
      {compareAt && <span className="price-old">{brl(compareAt)}</span>}
      <span className="price">{brl(price)}</span>
      <span className="installments">no Pix</span>
    </div>
  );
}

export function ProductCard({ p }: { p: Produto }) {
  const { off } = priceOf(p);
  return (
    <article className="card">
      <div className="badges">
        {p.novo && <span className="badge badge--new">Novo</span>}
        {off > 0 && <span className="badge badge--off">-{off}%</span>}
      </div>
      <Link to="/produto/$id" params={{ id: p.id }} className="card__media">
        <ProductImage p={p} />
      </Link>
      <Link to="/produto/$id" params={{ id: p.id }}>
        <div className="card__ref">
          {p.marca} · REF. {p.ref}
        </div>
        <h3 className="card__name">{p.nome}</h3>
      </Link>
      <Price p={p} />
      <Link to="/produto/$id" params={{ id: p.id }} className="btn btn--pink card__quick">
        Comprar
      </Link>
    </article>
  );
}
