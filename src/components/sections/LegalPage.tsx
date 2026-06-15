import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Container } from "@/components/layout/Container";
import type { LegalDoc } from "@/lib/legal";

/** Renders a static legal document (privacy, cookies, terms, security). */
export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Header variant="white" />
      <main className="bg-surface py-10">
        <Container className="max-w-[820px]">
          <article className="rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-[28px] font-bold leading-tight text-foreground">
              {doc.title}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{doc.updatedLabel}</p>
            <p className="mt-5 text-[15px] leading-relaxed text-foreground/80">
              {doc.intro}
            </p>

            <div className="mt-8 flex flex-col gap-7">
              {doc.sections.map((section) => (
                <section key={section.heading}>
                  <h2 className="text-[17px] font-bold text-foreground">
                    {section.heading}
                  </h2>
                  {section.paragraphs?.map((p, i) => (
                    <p
                      key={i}
                      className="mt-2 text-[15px] leading-relaxed text-foreground/80"
                    >
                      {p}
                    </p>
                  ))}
                  {section.list && (
                    <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed text-foreground/80 marker:text-brand">
                      {section.list.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          </article>
        </Container>
      </main>
      <Footer />
    </>
  );
}
