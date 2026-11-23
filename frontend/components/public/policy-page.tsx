"use client";

import { PageHeader } from "@/components/shared/page-header";
import { usePageMeta } from "@/lib/use-page-meta";

interface PolicyPageProps {
  title: string;
  eyebrow?: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

export function PolicyPage({ title, eyebrow, summary, sections }: PolicyPageProps) {
  usePageMeta({
    title,
    description: summary,
  });

  return (
    <div className="page-shell max-w-3xl space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={eyebrow ?? "Clinic policy"}
        title={title}
        description={summary}
      />

      <div className="space-y-7">
        {sections.map((section) => (
          <section key={section.heading} className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {section.heading}
            </h2>
            {section.body.map((paragraph, index) => (
              <p
                key={index}
                className="text-sm leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <p className="border-t pt-4 text-xs text-muted-foreground">
        Effective Date: January 2026 · OptiCo Clinical Operations & Governance.
      </p>
    </div>
  );
}
