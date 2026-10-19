import type { Produto } from "@/lib/catalog";
import preto from "@/assets/br-11134207-81z1k-mfxm7r37y2h144@resize_w900_nl.webp.asset.json";
import azul from "@/assets/br-11134207-81z1k-mgzzteaugbgk9d@resize_w900_nl.webp.asset.json";
import offCobre from "@/assets/br-11134207-81ztc-mjf3dqoggfsy75@resize_w900_nl.webp.asset.json";
import nude from "@/assets/br-11134207-81z1k-mgyanhedxslj66@resize_w900_nl.webp.asset.json";
import pink from "@/assets/br-11134207-7r98o-m9aan0641a0yab@resize_w900_nl.webp.asset.json";
import azulExtra from "@/assets/br-11134207-7r98o-m85thxlixmhd75@resize_w900_nl.webp.asset.json";
import off from "@/assets/br-11134207-7r98o-m9is5pkc5eki1b@resize_w900_nl.webp.asset.json";
import dourado from "@/assets/br-11134207-7r98o-m9q515kxb30i42@resize_w900_nl.webp.asset.json";

export const SANDAL_ID = "moleca-strass";
export const SANDAL_SIZES = ["33", "34", "35", "36", "37", "38", "39", "40"];
export const sandalOption = (size: string, color: string) => `${size} · ${color}`;

export const FEATURED_SANDAL: Produto = {
  id: SANDAL_ID,
  // Store SKU, not an unverified manufacturer reference.
  ref: "AF-STRASS",
  nome: "Papete",
  marca: "Armazém Feminino",
  categoria: "sandalias",
  // Existing store-wide 50% discount yields the requested final price of 29.90.
  preco: 59.8,
  imagens: [preto.url, azul.url, offCobre.url, nude.url, pink.url, off.url, dourado.url, azulExtra.url],
  cores: [
    { nome: "Preto", imagem: 0 },
    { nome: "Azul", imagem: 1 },
    { nome: "Off-white cobre", imagem: 2 },
    { nome: "Nude", imagem: 3 },
    { nome: "Pink", imagem: 4 },
    { nome: "Off-white", imagem: 5 },
    { nome: "Nude dourado", imagem: 6 },
  ],
  tamanhos: [],
  descricao: "Papete com tiras de brilho e solado baixo. Disponível nas cores das fotos: preto, azul, off-white com brilho cobre, nude, pink, off-white e nude com brilho dourado.",
};

// Keep the existing cart/order contract: the selected color travels with the size.
FEATURED_SANDAL.tamanhos = FEATURED_SANDAL.cores?.flatMap((color) =>
  SANDAL_SIZES.map((size) => sandalOption(size, color.nome)),
) ?? [];