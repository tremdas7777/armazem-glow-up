import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";
import { store } from "@/lib/store-settings";

/**
 * Logo da loja (wordmark Armazém Feminino).
 * `tone="original"` = claro (header sobre vídeo/escuro);
 * `tone="brand"` = cor da marca (checkout / fundos claros);
 * `tone="white"` = branco (rodapé).
 */
export function BrandLogo({
  className,
  tone = "brand",
}: {
  className?: string;
  tone?: "original" | "brand" | "white";
}) {
  if (!brand.showLogo || store.hideLogos) return null;

  const color =
    tone === "white" ? "#fff" : tone === "original" ? "#fff" : brand.colors.primary;

  return (
    <span
      role="img"
      aria-label={brand.name}
      className={cn(
        "inline-flex items-center font-serif text-[clamp(1.05rem,2.2vw,1.55rem)] font-bold tracking-[0.04em] leading-none",
        className,
      )}
      style={{ color }}
    >
      Armazém Feminino
    </span>
  );
}
