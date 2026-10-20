import Link from "next/link";
import { Footer } from "./landing-page/footer";
import { Header } from "./landing-page/header";

export type LegalSection = {
  id: string;
  title: string;
  content: React.ReactNode;
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  updated: string;
  sections: LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  introduction,
  updated,
  sections,
}: LegalPageProps) {
  return (
    <div className="min-h-svh bg-[#fbf7f4] font-(family-name:--font-dm-sans) text-[#23211f]">
      <Header />
      <main>
        <section className="border-b border-[#e8cbbb] bg-[#f9e9e0]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
            <p className="text-xs font-semibold tracking-[0.18em] text-[#e56829] uppercase">
              {eyebrow}
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl leading-[1.05] font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-[#706c67] sm:text-lg">
              {introduction}
            </p>
            <p className="mt-7 text-sm font-medium text-[#d85a1b]">
              Last updated {updated}
            </p>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[250px_minmax(0,760px)] lg:gap-20 lg:px-10 lg:py-20">
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-black/8 bg-white p-5">
              <p className="text-xs font-semibold tracking-[0.12em] text-[#86827e] uppercase">
                On this page
              </p>
              <nav className="mt-4 flex flex-col">
                {sections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="border-l border-black/9 py-2.5 pl-4 text-sm text-[#6b6864] transition hover:border-[#e7743b] hover:text-[#c55218]"
                  >
                    {section.title}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-28 ${
                  index ? "mt-10 border-t border-black/8 pt-10" : ""
                }`}
              >
                <h2 className="text-2xl font-semibold tracking-[-0.035em] text-[#272624] sm:text-[1.75rem]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-7 text-[#686460] [&_a]:font-medium [&_a]:text-[#d95a1b] [&_a]:underline [&_a]:underline-offset-3 [&_li]:pl-1 [&_strong]:font-semibold [&_strong]:text-[#34322f] [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
                  {section.content}
                </div>
              </section>
            ))}

            <div className="mt-12 rounded-2xl border border-[#e9cebe] bg-[#fcece3] p-6 sm:p-7">
              <p className="text-lg font-semibold tracking-[-0.025em]">
                Have a question about this page?
              </p>
              <p className="mt-2 text-sm leading-6 text-[#706c67]">
                We want our policies to be clear and easy to understand. Reach
                out and we’ll be happy to help.
              </p>
              <a
                href="mailto:legal@coverpro.co.za"
                className="mt-5 inline-flex rounded-xl bg-[#272624] px-4 py-2.5 text-sm font-semibold text-white! transition hover:bg-[#3e3c39]"
              >
                Contact our team
              </a>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  );
}
