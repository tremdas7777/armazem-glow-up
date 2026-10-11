import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { brand } from "@/lib/brand";
import { categoriesWithProducts, PRODUCTS } from "@/lib/catalog";
import { MAX_QTY, useCart } from "@/lib/cart";
import { brl, isFreeShippingEligible, priceOf, store } from "@/lib/store-settings";
import { ProductImage } from "./ProductCard";

const hasOffers = () => PRODUCTS.some((p) => priceOf(p).off > 0);

function Icon({ d, children }: { d?: string; children?: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

function Header() {
  const cart = useCart();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const location = useRouterState({ select: (s) => s.location });
  const params = new URLSearchParams(location.searchStr);
  const current =
    location.pathname === "/colecao"
      ? params.get("novo")
        ? "novo"
        : params.get("oferta")
          ? "oferta"
          : (params.get("cat") ?? "")
      : null;

  useEffect(() => setMenu(false), [location.href]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSearch(false);
    navigate({ to: "/colecao", search: q.trim() ? { q: q.trim() } : {} });
  };

  const navLink = (to: string, label: string, search?: Record<string, string>) => (
    <Link to={to} search={search ?? {}} activeOptions={{ includeSearch: true }} activeProps={{ className: "active" }}>
      {label}
    </Link>
  );

  return (
    <>
      {store.discountPct > 0 || store.freeShippingMin > 0 ? (
        <div className="topbar">
          {[
            store.discountPct > 0 ? `${store.discountPct}% OFF em toda a loja` : null,
            store.freeShippingMin > 0 ? `Frete grátis acima de ${brl(store.freeShippingMin)}` : null,
            "Pagamento seguro no Pix",
          ]
            .filter(Boolean)
            .join(" • ")}
        </div>
      ) : null}
      <header className="header">
        <div className="header__inner">
          <button className="icon-btn menu-toggle" aria-label="Abrir menu" onClick={() => setMenu(true)}>
            <Icon d="M3 6h18M3 12h18M3 18h18" />
          </button>
          <Link to="/" className="logo">
            {brand.name}
          </Link>
          <nav className={`nav ${menu ? "open" : ""}`}>
            {navLink("/", "Home")}
            {navLink("/colecao", "Lançamentos", { novo: "1" })}
            {navLink("/colecao", "Coleção")}
            {hasOffers() && navLink("/colecao", "Ofertas", { oferta: "1" })}
            {navLink("/sobre", "A loja")}
            {navLink("/contato", "Contato")}
          </nav>
          <div className="header__actions">
            <button className="icon-btn" aria-label="Buscar" onClick={() => setSearch((v) => !v)}>
              <Icon>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </Icon>
            </button>
            <button className="icon-btn cart-btn" aria-label="Sacola" onClick={() => cart.setOpen(true)}>
              <Icon>
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </Icon>
              <span className="cart-count">{cart.count}</span>
            </button>
          </div>
        </div>
        <nav className="catbar" aria-label="Categorias">
          <div className="catbar__inner">
            <Link to="/colecao" search={{ novo: "1" }} className={`hot ${current === "novo" ? "active" : ""}`}>
              Novidades
            </Link>
            {categoriesWithProducts().map((c) => (
              <Link
                key={c.slug}
                to="/colecao"
                search={{ cat: c.slug }}
                className={current === c.slug ? "active" : ""}
              >
                {c.nome}
              </Link>
            ))}
            {hasOffers() && (
              <Link to="/colecao" search={{ oferta: "1" }} className={`hot ${current === "oferta" ? "active" : ""}`}>
                Ofertas
              </Link>
            )}
          </div>
        </nav>
        <form className={`searchbar ${search ? "open" : ""}`} onSubmit={submit}>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Busque pelo nome, marca ou referência"
            autoComplete="off"
            autoFocus={search}
          />
          <button type="submit">Buscar</button>
        </form>
      </header>
      <div className={`overlay ${menu ? "show" : ""}`} onClick={() => setMenu(false)} />
    </>
  );
}

function Footer() {
  const c = brand.company;
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <Link to="/" className="logo">
              {brand.name}
            </Link>
            <p style={{ maxWidth: "34ch", lineHeight: 1.6, margin: "14px 0 0" }}>
              {brand.tagline}. Calçados de várias marcas, com conforto e estilo para todos os passos.
            </p>
          </div>
          <div>
            <h4>Coleção</h4>
            <ul>
              {categoriesWithProducts()
                .slice(0, 6)
                .map((cat) => (
                  <li key={cat.slug}>
                    <Link to="/colecao" search={{ cat: cat.slug }}>
                      {cat.nome}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h4>Institucional</h4>
            <ul>
              <li><Link to="/sobre">A loja</Link></li>
              <li><Link to="/politica-reembolso">Trocas e devoluções</Link></li>
              <li><Link to="/politica-envio">Envio e prazos</Link></li>
              <li><Link to="/politica-privacidade">Privacidade</Link></li>
              <li><Link to="/rastreio">Rastrear pedido</Link></li>
            </ul>
          </div>
          <div>
            <h4>Atendimento</h4>
            <ul>
              <li><Link to="/contato">Fale conosco</Link></li>
              {brand.email && <li><a href={`mailto:${brand.email}`}>{brand.email}</a></li>}
              {brand.whatsapp.display && <li>WhatsApp {brand.whatsapp.display}</li>}
            </ul>
          </div>
        </div>
        <div className="footer__bottom">
          <span>
            © {new Date().getFullYear()} {brand.name}
            {c.legalName && <> • {c.legalName}</>}
            {c.cnpj && <> • CNPJ {c.cnpj}</>}
            {c.address && (
              <>
                <br />
                {c.address}
              </>
            )}
          </span>
          <span>Pagamento via Pix</span>
        </div>
      </div>
    </footer>
  );
}

function CartDrawer() {
  const cart = useCart();
  const navigate = useNavigate();
  const close = () => cart.setOpen(false);
  const meta = store.freeShippingMin;
  const falta = Math.max(0, meta - cart.subtotal);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <>
      <div className={`overlay ${cart.open ? "show" : ""}`} onClick={close} />
      <aside className={`drawer ${cart.open ? "open" : ""}`} aria-label="Sacola de compras">
        <div className="drawer__head">
          <h3>Sua sacola</h3>
          <button className="icon-btn" aria-label="Fechar" onClick={close}>
            <Icon d="M6 6l12 12M18 6 6 18" />
          </button>
        </div>
        <div className="drawer__body">
          {!cart.lines.length ? (
            <div className="cart-empty">
              <Icon>
                <path d="M6 7h12l-1 13H7L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </Icon>
              <p>Sua sacola está vazia.</p>
              <Link to="/colecao" className="btn btn--pink" onClick={close}>
                Ver coleção
              </Link>
            </div>
          ) : (
            cart.lines.map((l, i) => (
              <div className="line-item" key={`${l.id}-${l.tamanho}`}>
                <Link to="/produto/$id" params={{ id: l.id }} className="line-item__img" onClick={close}>
                  <ProductImage p={l.product} />
                </Link>
                <div>
                  <h4>{l.product.nome}</h4>
                  <small>
                    {l.product.marca} · Ref. {l.product.ref} · Tam. {l.tamanho}
                  </small>
                  <div className="qty">
                    <button aria-label="Diminuir" onClick={() => cart.setQty(i, l.qtd - 1)}>
                      −
                    </button>
                    <span>{l.qtd}</span>
                    <button
                      aria-label="Aumentar"
                      disabled={l.qtd >= MAX_QTY}
                      onClick={() => cart.setQty(i, l.qtd + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="line-item__right">
                  <strong>{brl(l.total)}</strong>
                  <button className="remove" onClick={() => cart.remove(i)}>
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.lines.length > 0 && (
          <div className="drawer__foot">
            {meta > 0 && (
              <div className="ship-bar">
                {isFreeShippingEligible(cart.subtotal) ? (
                  <>
                    <strong>Parabéns!</strong> Você ganhou frete grátis.
                  </>
                ) : (
                  <>
                    Faltam <strong>{brl(falta)}</strong> para o frete grátis
                  </>
                )}
                <div className="ship-bar__track">
                  <div
                    className="ship-bar__fill"
                    style={{ width: `${Math.min(100, (cart.subtotal / meta) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            <div className="totals">
              <span>Subtotal</span>
              <span>{brl(cart.subtotal)}</span>
            </div>
            <button
              className="btn btn--pink btn--block"
              onClick={() => {
                close();
                navigate({ to: "/checkout" });
              }}
            >
              Finalizar compra
            </button>
            <button className="btn btn--ghost btn--block" onClick={close}>
              Continuar comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/** Moldura da loja: aviso, cabeçalho, categorias, rodapé e sacola. */
export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="store">
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
