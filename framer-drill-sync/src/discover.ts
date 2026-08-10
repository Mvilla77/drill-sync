/**
 * Optional local sanity check: `npm run discover`
 * (You can also just hit GET /drills/raw and GET /drills on the deployed
 * service directly -- that's the cloud-friendly equivalent of this script.)
 */
import { connectFramer, listDrillGroups } from "./framer-drills.ts";

async function main() {
  const framer = await connectFramer();
  try {
    const drills = await listDrillGroups(framer);
    console.log(`Found ${drills.length} unique drill(s) across all breakpoints.\n`);
    for (const d of drills) {
      console.log("──────────────────────────────────────");
      console.log(`${d.program} / ${d.day} / ${d.block} / ${d.exercise}`);
      console.log(`duration:   ${d.duration}`);
      console.log(`coachNotes: ${d.coachNotes}`);
      console.log(`purpose:    ${d.purpose}`);
      console.log(`breakpoints covered: ${d.breakpoints.join(", ")} (${d.nodeIds.length} node(s))`);
    }
  } finally {
    await framer.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
