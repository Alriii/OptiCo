import { PageHeader } from "@/components/shared/page-header";

interface PolicyPageProps {
  title: string;
  eyebrow?: string;
  summary: string;
  sections: { heading: string; body: string[] }[];
}

export function PolicyPage({ title, eyebrow, summary, sections }: PolicyPageProps) {
  return (
    <div className="page-shell max-w-3xl space-y-8 py-10 sm:py-14">
      <PageHeader
        eyebrow={eyebrow ?? "Clinic policy"}
        title={title}
        description={summary}
      />

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
        Sample policy text for development. The clinic must review and approve
        the final wording, retention rules, and legal basis before using real
        patient data.
      </div>

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
        Last updated: sample document for the OptiCo development build.
      </p>
    </div>
  );
}
