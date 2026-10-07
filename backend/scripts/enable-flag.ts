import "../src/config/load-env.js";
import { prisma } from "../src/lib/prisma.js";
import { KNOWN_FLAGS } from "../src/modules/platform/flags.js";
const key = process.argv[2];
await prisma.featureFlag.upsert({ where: { key }, create: { key, description: KNOWN_FLAGS[key] ?? key, enabled: true }, update: { enabled: true } });
console.log(`Enabled ${key}`);
await prisma.$disconnect();
