// Catálogo da loja. Os produtos ficam em catalog-data.ts (um por linha, fácil de editar ou gerar).
// O preço cobrado é sempre calculado no servidor a partir daqui + o desconto geral do /admin.
import { PRODUTOS } from "@/lib/catalog-data";

export type Categoria = { slug: string; nome: string };

export type Produto = {
  /** Único, usado no link (/produto/<id>). */
  id: string;
  ref: string;
  nome: string;
  marca: string;
  categoria: string;
  /** Preço de tabela (antes do desconto geral do /admin). */
  preco: number;
  /** Preço "de" riscado, quando o próprio produto já tem promoção. */
  precoAntigo?: number;
  /** Custo unitário (para o painel de lucro). Opcional. */
  custo?: number;
  imagens: string[];
  tamanhos: string[];
  cor?: string;
  novo?: boolean;
  maisVendido?: boolean;
  /** false tira o produto da loja e bloqueia a venda (padrão: ativo). */
  ativo?: boolean;
  descricao: string;
};

export const CATEGORIAS: Categoria[] = [
  { slug: "sandalias", nome: "Sandálias" },
  { slug: "chinelos", nome: "Chinelos" },
  { slug: "tenis", nome: "Tênis" },
  { slug: "botas", nome: "Botas" },
  { slug: "sapatilhas", nome: "Sapatilhas" },
  { slug: "mocassim", nome: "Mocassim" },
  { slug: "tamancos", nome: "Tamancos" },
  { slug: "sapatos", nome: "Sapatos" },
  { slug: "sapato-casual", nome: "Sapato Casual" },
  { slug: "bolsas", nome: "Bolsas" },
];

/** Produtos à venda (os inativos não aparecem nem podem ser comprados). */
export const PRODUCTS: Produto[] = PRODUTOS.filter((p) => p.ativo !== false);

const byIdMap = new Map(PRODUCTS.map((p) => [p.id, p]));
export const getProduct = (id: string) => byIdMap.get(id);

export const categoryName = (slug: string) => CATEGORIAS.find((c) => c.slug === slug)?.nome ?? slug;
export const categoriesWithProducts = () =>
  CATEGORIAS.filter((c) => PRODUCTS.some((p) => p.categoria === c.slug));
export const brands = () => [...new Set(PRODUCTS.map((p) => p.marca))].sort((a, b) => a.localeCompare(b));
export const brandSlug = (marca: string) =>
  marca
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Nome completo usado no pedido, no gateway e nos relatórios. */
export const itemLabel = (p: Produto, tamanho: string) =>
  `${p.nome} Ref. ${p.ref}${tamanho && tamanho !== "Único" ? ` (tam. ${tamanho})` : ""}`;
