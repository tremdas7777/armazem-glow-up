import type { ReactNode } from "react";
import { SiteLayout } from "./Layout";

export function PolicyPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <SiteLayout>
      <section className="page-hero page-hero--sm sequins">
        <h1>{title}</h1>
      </section>
      <section className="section">
        <div className="container prose">
          <p style={{ fontSize: 17 }}>{intro}</p>
          {children}
        </div>
      </section>
    </SiteLayout>
  );
}
