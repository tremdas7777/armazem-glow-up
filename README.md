# Armazém dos Chinelos

Loja multimarcas de calçados femininos (ARMAZEM DIGITAL LTDA · CNPJ 46.589.462/0001-97).
TanStack Start + Lovable Cloud (Supabase), hospedada no Lovable.

- **Vitrine**: home com categorias e vitrines, coleção com filtros (categoria, marca, tamanho,
  preço), página de produto com tamanhos, sacola.
- **Checkout Pix** por sacola (vários produtos e tamanhos). O preço é sempre recalculado no
  servidor a partir do catálogo e da configuração do painel. O gateway recebe os **nomes reais dos
  produtos** e cada item com quantidade e preço; o frete vai como item próprio. Nenhuma cobrança
  depois do pagamento.
- **Gateways**: SagacePay (padrão) e MagicPay. Escolha e chaves em `/admin` → Integrações; cada
  pedido guarda em qual gateway nasceu (MagicPay com prefixo `mp_`). Webhook:
  `/api/public/pix-webhook`.
- **Painel `/admin`**: funil, pedidos, checkouts abandonados, lucro, **Loja** (desconto geral e
  frete) e integrações (gateway, UTMify, Meta, Pushcut).

## Antes de publicar

1. **Lovable Cloud**: ative o Cloud neste projeto e rode as migrações de `supabase/migrations`
   (tabelas `funnel_events`, `site_settings`, `private_settings`, `pix_orders`).
2. **Secrets** (Lovable Cloud): `ADMIN_PASSWORD` (obrigatório). Opcionais: `RASTREIO_API_KEY`,
   `RASTREIO_API_URL`, e as chaves dos gateways como reserva (`SAGACEPAY_API_KEY`,
   `MAGICPAY_PUBLIC_KEY`, `MAGICPAY_SECRET_KEY`). Veja `.env.example`.
3. **Gateways**: em `/admin` → Integrações, cadastre as chaves, use "Testar" e escolha o gateway.
   Cadastre o webhook `https://SEU-DOMINIO/api/public/pix-webhook` (MagicPay: `?gw=mp`) no painel
   do gateway, se ele pedir.
4. **Dados da loja**: `src/lib/brand.ts` (e-mail, WhatsApp, domínio, redes sociais).
5. **Catálogo**: `src/lib/catalog-data.ts` (um produto por linha). Confira **tamanhos** e
   **estoque** com o fornecedor, preencha `custo` para o painel de lucro e use `"ativo": false`
   para tirar um produto da loja sem apagar.
6. **Desconto e frete**: `/admin` → Loja (padrão do código em `src/lib/store-settings.ts`).

## Desenvolvimento

```sh
npm i
npm run dev
npm test
```
