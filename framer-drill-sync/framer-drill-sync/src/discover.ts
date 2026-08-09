/**
 * Run this FIRST, before wiring up n8n: `npm run discover`
 *
 * It connects to your Framer project, finds every "Drill Card" instance,
 * and prints what it found -- including the raw control keys Framer actually
 * uses internally. If the inferred Program/Day/Block/field values below look
 * wrong, this raw output tells you what to adjust in src/framer-drills.ts.
 */
import { connectFramer, listDrillCards } from "./framer-drills.ts";

async function main() {
  const framer = await connectFramer();
  try {
    const drills = await listDrillCards(framer);

    console.log(`Found ${drills.length} Drill Card instance(s).\n`);

    for (const d of drills) {
      console.log("──────────────────────────────────────");
      console.log(`id:        ${d.id}`);
      console.log(`program:   ${d.program}`);
      console.log(`day:       ${d.day}`);
      console.log(`block:     ${d.block}`);
      console.log(`breadcrumb:${d.breadcrumb.join(" > ")}`);
      console.log(`duration:  ${d.duration}`);
      console.log(`exercise:  ${d.exercise}`);
      console.log(`coachNotes:${d.coachNotes}`);
      console.log(`purpose:   ${d.purpose}`);
      console.log(`rawControls: ${JSON.stringify(d.rawControls)}`);
    }

    if (drills.length === 0) {
      console.log(
        "No instances found. Check DRILL_COMPONENT_NAME in src/framer-drills.ts " +
          "matches the component name exactly (case-sensitive).",
      );
    }
  } finally {
    await framer.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
