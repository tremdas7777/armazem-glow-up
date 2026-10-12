// Upsell "Proteção do pedido": oferecido logo após o Pix do pedido ser pago, numa cobrança separada.
// O valor cobrado sai daqui (servidor), nunca do navegador.
export const PROTECAO = {
  nome: "Proteção do pedido",
  priceCents: 990,
  promessa:
    "Se o pedido extraviar, for roubado ou chegar danificado, reenviamos na hora, com prioridade e sem burocracia, ou devolvemos o seu dinheiro.",
} as const;

export const PROTECAO_BUNDLE_ID = "protecao";
