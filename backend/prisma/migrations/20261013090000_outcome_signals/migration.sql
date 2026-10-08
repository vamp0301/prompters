-- Multiple outcome signals per recommendation (quiz, mastery, build, interview, retention), alongside the label.
ALTER TABLE "Recommendation" ADD COLUMN "outcomeSignals" JSONB;
