/**
 * Train the recommendation-success model from real, resolved recommendations.
 *   npm run ml:train
 * Records an MLTrainingRun either way; with too little data it says INSUFFICIENT_DATA and trains nothing.
 */
import "../src/config/load-env.js";
import path from "node:path";
import { prisma } from "../src/lib/prisma.js";
import { trainRecommendationModel } from "../src/modules/personalization/training.js";

const mlDir = process.env.ML_SERVICE_DIR ?? path.resolve(import.meta.dirname, "../../ml-service");
const run = await trainRecommendationModel({ mlDir, python: process.env.ML_PYTHON });
console.log(JSON.stringify({ status: run.status, modelVersion: run.modelVersion, datasetSize: run.datasetSize, positives: run.positives, negatives: run.negatives, library: run.library, metrics: run.metrics, notes: run.notes }, null, 2));
await prisma.$disconnect();
