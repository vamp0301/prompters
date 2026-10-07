import { Router } from "express";
import { currentUser } from "../../middleware/auth.js";
import { handler } from "../../utils/http.js";
import { readinessWithHistory } from "./readiness.service.js";

export function readinessRoutes() {
  const r = Router();
  r.get("/", handler(async (req) => readinessWithHistory(currentUser(req).id)));
  return r;
}
