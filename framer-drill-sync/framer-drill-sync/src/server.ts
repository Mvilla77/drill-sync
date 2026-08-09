import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { connectFramer, listDrillCards, updateDrillCard, type DrillUpdateInput } from "./framer-drills.ts";

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
// still debugging the Framer connection. Includes the error message and
// (for now) the stack, so you can see exactly what failed without needing
// to dig through Railway's logs each time.
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: err.message,
      stack: err instanceof Error ? err.stack : undefined,
    },
    500,
  );
});

// List every drill card currently on the site, with inferred Program/Day/Block.
// n8n uses this to populate the "which drill?" dropdowns in your form.
app.get("/drills", async (c) => {
  const framer = await connectFramer();
  try {
    const drills = await listDrillCards(framer);
    return c.json({ drills });
  } finally {
    await framer.disconnect();
  }
});

// Update one drill's fields. Body: { duration?, exercise?, coachNotes?, purpose? }
// Query param ?publish=true also publishes the change immediately.
app.patch("/drills/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json()) as DrillUpdateInput;
  const shouldPublish = c.req.query("publish") === "true";

  const framer = await connectFramer();
  try {
    const updated = await updateDrillCard(framer, id, body);
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

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Framer drill-sync service running on http://localhost:${info.port}`);
});
