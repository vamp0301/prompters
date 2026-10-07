// QA only: runs the API on :4100 with the deterministic fake AI from the tests.
import "../src/config/load-env.js";
import { createApp } from "../src/server/app.js";
import { setAIProvider } from "../src/ai/provider.js";
import { FakeAI } from "../tests/fake-ai.js";
setAIProvider(new FakeAI());
createApp().listen(4100, () => console.log("fake-AI API on :4100"));
