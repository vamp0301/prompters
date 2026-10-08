import { MarketDemand, SyllabusBrowser } from "@/features/syllabus/syllabus-view";

export const metadata = {
  title: "Language syllabus",
  description: "The same 16-module syllabus for Python, JavaScript, Java and C++, and which language developers use most.",
};

export default function SyllabusPage() {
  return (
    <>
      <section className="bg-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="eyebrow text-accent">Syllabus</div>
          <h1 className="font-display mt-3 text-[2.8rem] leading-[1.02] sm:text-[4rem]">
            Choose <span className="font-script text-6xl font-normal text-accent">your</span> language.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            Python, JavaScript, Java and C++ — one identical syllabus, so you can compare them side by side and switch without losing your place.
          </p>
        </div>
      </section>
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6 md:py-16">
        <MarketDemand />
        <SyllabusBrowser />
      </div>
    </>
  );
}
