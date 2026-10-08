"use client";
import { ArrowDown, ShieldQuestion } from "lucide-react";
import type { ProjectModule } from "@/lib/api/types";
import { Expand, LevelBadge, SectionTitle, track } from "./project-ui";

const LEVEL_NAME = ["", "Basic project knowledge", "Implementation", "Technical decisions", "Debugging, optimisation & architecture", "System design, scale & failures"];

/** 20 project-specific questions (L1–L5) with speakable answers, the drill-down chain, claim defense and experience questions. */
export function ProjectQuestions({ project }: { project: ProjectModule }) {
  const c = project.content!;
  return (
    <div className="space-y-10">
      <section aria-labelledby="pq-core">
        <SectionTitle eyebrow="20 core questions" title="What they'll ask about this project">
          Four per level. Open a question to see a speakable answer, what the interviewer is listening for, and where they go next.
        </SectionTitle>
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((l) => (
            <div key={l}>
              <h3 id={l === 1 ? "pq-core" : undefined} className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <LevelBadge level={l} /> {LEVEL_NAME[l]}
              </h3>
              <ol className="space-y-2">
                {c.questions
                  .filter((q) => q.level === l)
                  .map((q) => (
                    <li key={q.key}>
                      <Expand
                        onOpen={() => track("PROJECT_QUESTION_STARTED", project.id, { level: q.level, dimension: q.dimension })}
                        summary={
                          <>
                            <span className="font-medium">{q.question}</span>
                            <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-wide text-subtle">
                              {q.dimension.toLowerCase()} · {q.skill}
                            </span>
                          </>
                        }
                      >
                        <dl className="space-y-3 text-[13px] leading-relaxed">
                          <div>
                            <dt className="eyebrow text-text">Answer</dt>
                            <dd className="mt-1">{q.answer}</dd>
                          </div>
                          <div>
                            <dt className="eyebrow text-text">Why this answer</dt>
                            <dd className="mt-1 text-muted">{q.whyThisAnswer}</dd>
                          </div>
                          <div className="rounded-md bg-surface-2 p-3">
                            <dt className="font-medium">↳ {q.followUp}</dt>
                            <dd className="mt-1">{q.followUpAnswer}</dd>
                          </div>
                          <div className="rounded-md bg-surface-2 p-3">
                            <dt className="font-medium">↳↳ {q.deepFollowUp}</dt>
                            <dd className="mt-1">{q.deepFollowUpAnswer}</dd>
                          </div>
                        </dl>
                      </Expand>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {c.drillDown.length > 0 && (
        <section aria-labelledby="pq-drill">
          <SectionTitle eyebrow="Drill-down" title="How an interviewer digs in">
            Each question builds on your last answer. If you can follow this chain, you can defend the project.
          </SectionTitle>
          <ol id="pq-drill" className="space-y-1">
            {c.drillDown.map((d, i) => (
              <li key={i}>
                <div className="rounded-lg border border-border bg-surface px-3 py-2">
                  <p className="text-[14px]">
                    <span className="mr-2 font-mono text-xs text-subtle">{i + 1}</span>
                    {d.question}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Listening for: {d.lookingFor}</p>
                </div>
                {i < c.drillDown.length - 1 && <ArrowDown className="mx-auto my-0.5 size-3.5 text-subtle" aria-hidden />}
              </li>
            ))}
          </ol>
        </section>
      )}

      {c.claimDefense.length > 0 && (
        <section aria-labelledby="pq-claims">
          <SectionTitle eyebrow="Resume defense" title="Every claim on your resume will be tested">
            Vague claims don&apos;t survive an interview. Prepare a specific, honest answer for each.
          </SectionTitle>
          <div id="pq-claims" className="space-y-3">
            {c.claimDefense.map((d) => (
              <div key={d.claimId} className="rounded-lg border border-border bg-surface p-3">
                <p className="flex items-start gap-2 text-[14px] font-medium">
                  <ShieldQuestion className="mt-0.5 size-4 shrink-0 text-accent-2" aria-hidden /> &ldquo;{d.claim}&rdquo;
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-6 text-[13px]">
                  {d.questions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {c.experienceQuestions.length > 0 && (
        <section aria-labelledby="pq-exp">
          <SectionTitle eyebrow="Work experience" title="Ownership and production questions">
            Interviewers separate what you did from what the team did. Prepare real examples — these are prompts, not stories to memorise.
          </SectionTitle>
          <ul id="pq-exp" className="space-y-2">
            {c.experienceQuestions.map((q) => (
              <li key={q.question} className="rounded-lg border border-border bg-surface px-3 py-2">
                <p className="text-[14px] font-medium">{q.question}</p>
                <p className="mt-0.5 text-xs text-muted">Prepare: {q.hint}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
