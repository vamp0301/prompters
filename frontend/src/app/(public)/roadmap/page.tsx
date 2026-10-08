import { PublicRoadmap } from "@/features/marketing/public-roadmap";

export const metadata = {
  title: "Roadmap",
  description: "Every stage, module and topic on the Prompters path — from zero to job-ready, starting with Python or JavaScript.",
};

export default function RoadmapPage() {
  return (
    <>
      <section className="bg-grid border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="eyebrow text-accent">Roadmap</div>
          <h1 className="font-display mt-3 text-[2.8rem] leading-[1.02] sm:text-[4rem]">From zero to job-ready.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            One guided path. Start with Python or JavaScript, then every track meets in the same core: DSA, frontend, backend, DevOps, system
            design, applied AI and job readiness. Each stage unlocks after you pass its stage exam.
          </p>
        </div>
      </section>
      <section aria-labelledby="stages-heading" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <h2 id="stages-heading" className="sr-only">All stages</h2>
        <PublicRoadmap />
      </section>
    </>
  );
}
