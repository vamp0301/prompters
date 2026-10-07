import { PageHeader } from "@/components/ui/misc";
import { MarketDemand, SyllabusBrowser } from "@/features/syllabus/syllabus-view";

export const metadata = { title: "Language syllabus" };

export default function LearnSyllabusPage() {
  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="Syllabus"
        title="Python · JavaScript · Java · C++"
        description="The same 16 modules for every language, and which one fits the job you want."
      />
      <MarketDemand />
      <SyllabusBrowser roadmapHref="/learn" />
    </div>
  );
}
