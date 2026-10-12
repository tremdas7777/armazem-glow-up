import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/** Logo em texto da loja (troque por uma imagem quando houver o arquivo do logo). */
export function BrandLogo({ className }: { className?: string }) {
  if (!brand.showLogo) return null;

  return (
    <span
      className={cn("inline-flex items-center font-black leading-none tracking-tight whitespace-nowrap", className)}
      style={{ fontFamily: "Rubik, system-ui, sans-serif", color: "#d63a7a" }}
    >
      {brand.name}
    </span>
  );
}
