import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { store } from "@/lib/store-settings";

export const LOGO_SRC = "/logo-moleca.png";
/** Proporção do arquivo do logo (largura / altura). */
const LOGO_RATIO = 256 / 53;

/**
 * Logo da loja. `tone="original"` usa o arquivo amarelo (para fundos escuros);
 * `tone="brand"` pinta o mesmo desenho na cor da marca (para fundos claros);
 * `tone="white"` pinta de branco (rodapé).
 * Controle o tamanho pela altura (ex.: `h-8`).
 */
export function BrandLogo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "original" | "brand" | "white";
}) {
  if (!brand.showLogo || store.hideLogos) return null;

  if (tone === "original") {
    return <img src={LOGO_SRC} alt={brand.name} className={cn("block w-auto", className)} />;
  }
  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn("block", className)}
      style={{
        aspectRatio: LOGO_RATIO,
        backgroundColor: tone === "white" ? "#fff" : brand.colors.primary,
        WebkitMask: `url(${LOGO_SRC}) center / contain no-repeat`,
        mask: `url(${LOGO_SRC}) center / contain no-repeat`,
      }}
    />
  );
}
