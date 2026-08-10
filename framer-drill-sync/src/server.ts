import { serve } from "@hono/node-server";
import { Hono } from "hono";
import {
  connectFramer,
  listDrillGroups,
  listRawDrillCards,
  updateDrillGroup,
  randomizeDrillsFromPool,
  bulkUpdateDrills,
  type DrillUpdateInput,
} from "./framer-drills.ts";
import { NEW_DRILL_POOL } from "./new-drill-pool.ts";

const SERVICE_API_KEY = process.env["SERVICE_API_KEY"];
const PORT = Number(process.env["PORT"] ?? 3000);

const app = new Hono();

// Simple shared-secret auth so only your n8n instance can call this service.
// n8n sends: Authorization: Bearer <SERVICE_API_KEY>
app.use(async (c, next) => {
  if (!SERVICE_API_KEY) return next(); // auth disabled if not configured (fine for local dev only)
  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${SERVICE_API_KEY}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
});

app.get("/health", (c) => c.json({ ok: true }));

// Surface real errors in the response instead of a bare 500, while we're
// still debugging the Framer connection.
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message, stack: err instanceof Error ? err.stack : undefined }, 500);
});

// List every drill, merged across its Desktop/Tablet/Phone breakpoint copies.
// This is what n8n uses to populate "which drill?" dropdowns.
app.get("/drills", async (c) => {
  const framer = await connectFramer();
  try {
    const drills = await listDrillGroups(framer);
    return c.json({ drills });
  } finally {
    await framer.disconnect();
  }
});

// Debug view: every raw component instance (one row per breakpoint copy),
// including the untouched controls object with real internal key names.
app.get("/drills/raw", async (c) => {
  const framer = await connectFramer();
  try {
    const drills = await listRawDrillCards(framer);
    return c.json({ drills });
  } finally {
    await framer.disconnect();
  }
});

// Update a drill. Body must identify which drill to change via its CURRENT
// program/day/block/currentExercise, plus the fields to change. To rename the
// drill itself, include "exercise" with the new name (separate from
// "currentExercise", which is only used to find it):
// {
//   "program": "Adult Class", "day": "Monday", "block": "Adult Footwork Block",
//   "currentExercise": "Hill-hill & Toe-toe",
//   "duration": "12 min",
//   "exercise": "New Name"   // optional -- renames the drill
// }
// Updates every breakpoint copy (Desktop/Tablet/Phone) together.
// Add ?publish=true to publish immediately.
app.patch("/drills", async (c) => {
  const body = (await c.req.json()) as DrillUpdateInput & {
    program: string;
    day: string;
    block: string;
    currentExercise: string;
  };
  const { program, day, block, currentExercise, ...update } = body;
  if (!program || !day || !block || !currentExercise) {
    return c.json({ error: "program, day, block, and currentExercise are all required to identify the drill" }, 400);
  }
  const shouldPublish = c.req.query("publish") === "true";

  // Treat empty/whitespace-only strings as "no change" -- important for the
  // AI agent, which sends every field on every call but leaves unchanged
  // ones as "".
  const cleanUpdate: DrillUpdateInput = {};
  for (const [key, value] of Object.entries(update)) {
    if (typeof value === "string" && value.trim() !== "") {
      (cleanUpdate as Record<string, string>)[key] = value;
    }
  }

  const framer = await connectFramer();
  try {
    const updated = await updateDrillGroup(framer, { program, day, block, exercise: currentExercise }, cleanUpdate);
    if (!updated) return c.json({ error: "Drill not found" }, 404);

    let publishResult = null;
    if (shouldPublish) {
      publishResult = await framer.publish();
    }

    return c.json({ drill: updated, published: publishResult !== null, publishResult });
  } finally {
    await framer.disconnect();
  }
});

// Publish separately, e.g. after batching several edits together.
app.post("/publish", async (c) => {
  const framer = await connectFramer();
  try {
    const result = await framer.publish();
    return c.json({ published: true, result });
  } finally {
    await framer.disconnect();
  }
});

// Bulk-update several drills in ONE Framer connection (avoids the
// "too many concurrent sessions" error you get from firing many separate
// PATCH /drills calls back to back). Body:
// { "updates": [ { program, day, block, currentExercise, exercise?, duration?, coachNotes?, purpose? }, ... ] }
// Add ?publish=true to publish once at the end.
app.patch("/drills/bulk", async (c) => {
  const body = (await c.req.json()) as {
    updates: Array<{
      id: string; // from GET /drills -> DrillGroup.id (NOT the exercise name)
    } & DrillUpdateInput>;
  };

  if (!Array.isArray(body.updates)) {
    return c.json({ error: "Body must be { updates: [ ... ] }" }, 400);
  }

  const shouldPublish = c.req.query("publish") === "true";
  const framer = await connectFramer();
  try {
    const results = await bulkUpdateDrills(framer, body.updates);

    let publishResult = null;
    if (shouldPublish) {
      publishResult = await framer.publish();
    }

    return c.json({ results, count: results.length, published: publishResult !== null, publishResult });
  } finally {
    await framer.disconnect();
  }
});

// Bulk-populate every card on the site with a random drill from the
// 40-drill pool (src/new-drill-pool.ts), matched by program+block, without
// repeating within a group. Add ?publish=true to publish immediately.
app.post("/drills/randomize", async (c) => {
  const shouldPublish = c.req.query("publish") === "true";

  const framer = await connectFramer();
  try {
    const results = await randomizeDrillsFromPool(framer, NEW_DRILL_POOL);

    let publishResult = null;
    if (shouldPublish) {
      publishResult = await framer.publish();
    }

    return c.json({ results, count: results.length, published: publishResult !== null, publishResult });
  } finally {
    await framer.disconnect();
  }
});

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Framer drill-sync service running on http://localhost:${info.port}`);
});
