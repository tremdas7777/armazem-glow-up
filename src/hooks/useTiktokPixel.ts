import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { getTiktokPixelId } from "@/lib/tiktok.functions";
import { loadTiktokPixel, rememberTtclid, tiktokPage } from "@/lib/tiktok-pixel";

/** Carrega o pixel do TikTok com o ID salvo no /admin e envia PageView a cada troca de página. */
export function useTiktokPixel() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    rememberTtclid();
    if (window.location.pathname.startsWith("/admin")) return;
    getTiktokPixelId()
      .then((r) => {
        if (r.pixelId) loadTiktokPixel(r.pixelId);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (path.startsWith("/admin")) return;
    tiktokPage();
  }, [path]);
}
