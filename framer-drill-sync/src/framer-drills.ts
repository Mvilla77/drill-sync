import { connect, type Framer, type ComponentInstanceNode, type AnyNode } from "framer-api";

const PROJECT_URL = process.env["FRAMER_PROJECT_URL"];
const API_KEY = process.env["FRAMER_API_KEY"];

if (!PROJECT_URL) throw new Error("FRAMER_PROJECT_URL env var is required");
if (!API_KEY) throw new Error("FRAMER_API_KEY env var is required");

// Name of the design component as it appears in Framer (Assets panel / instance name).
export const DRILL_COMPONENT_NAME = "Drill Card";

// Confirmed via `GET /drills?raw=true` against the live project on 2026-08-09.
// These are the actual internal keys Framer generated for the "Drill Card Variables".
// If you ever add a new variable in Framer, or these ever stop matching, re-run
// the raw endpoint and update this map.
const CONTROL_KEYS = {
  duration: "qdIyhjSIk",
  exercise: "ggM0r7_4Y",
  coachNotes: "Z083JQaUA",
  purpose: "Sn_Hsn3JC",
} as const;

export interface RawDrillCard {
  id: string;
  program: string | null;
  day: string | null;
  block: string | null;
  breakpoint: string | null; // "Desktop" / "Tablet" / "Phone"
  breadcrumb: string[];
  duration: string | null;
  exercise: string | null;
  coachNotes: string | null;
  purpose: string | null;
  rawControls: Record<string, unknown>;
}

/** One real-world drill, merged across its Desktop/Tablet/Phone instances. */
export interface DrillGroup {
  program: string | null;
  day: string | null;
  block: string | null;
  duration: string | null;
  exercise: string | null;
  coachNotes: string | null;
  purpose: string | null;
  nodeIds: string[]; // one id per breakpoint instance -- all get updated together
  breakpoints: string[];
}

const DAY_NAMES = ["Monday", "Wednesday"];
const PROGRAM_MARKERS = ["Adult", "Youth"];
const BREAKPOINT_NAMES = ["Desktop", "Tablet", "Phone"];

export async function connectFramer(): Promise<Framer> {
  return connect(PROJECT_URL as string, API_KEY as string);
}

async function getAncestorNames(node: AnyNode): Promise<string[]> {
  const names: string[] = [];
  let current: AnyNode | null = await node.getParent();
  while (current) {
    if ("name" in current && current.name) names.unshift(current.name);
    current = await current.getParent();
  }
  return names;
}

function inferDay(breadcrumb: string[]): string | null {
  return breadcrumb.find((n) => DAY_NAMES.some((d) => n.includes(d))) ?? null;
}

function inferProgram(breadcrumb: string[]): string | null {
  return breadcrumb.find((n) => PROGRAM_MARKERS.some((p) => n.includes(p))) ?? null;
}

function inferBreakpoint(breadcrumb: string[]): string | null {
  return breadcrumb.find((n) => BREAKPOINT_NAMES.includes(n)) ?? null;
}

function inferBlock(breadcrumb: string[], day: string | null): string | null {
  const dayIndex = day ? breadcrumb.findIndex((n) => n === day) : -1;
  if (dayIndex >= 0 && breadcrumb.length > dayIndex + 1) {
    return breadcrumb[dayIndex + 1] ?? null;
  }
  return null;
}

function readControl(controls: Record<string, unknown>, key: string): string | null {
  const value = controls[key];
  return typeof value === "string" ? value : null;
}

function toRawDrillCard(instance: ComponentInstanceNode, breadcrumb: string[]): RawDrillCard {
  const controls = instance.controls ?? {};
  const day = inferDay(breadcrumb);
  return {
    id: instance.id,
    program: inferProgram(breadcrumb),
    day,
    block: inferBlock(breadcrumb, day),
    breakpoint: inferBreakpoint(breadcrumb),
    breadcrumb,
    duration: readControl(controls, CONTROL_KEYS.duration),
    exercise: readControl(controls, CONTROL_KEYS.exercise),
    coachNotes: readControl(controls, CONTROL_KEYS.coachNotes),
    purpose: readControl(controls, CONTROL_KEYS.purpose),
    rawControls: controls,
  };
}

/** Every Drill Card instance, one row per breakpoint copy. Mostly useful for debugging. */
export async function listRawDrillCards(framer: Framer): Promise<RawDrillCard[]> {
  const instances = await framer.getNodesWithType("ComponentInstanceNode");
  const drillInstances = instances.filter((i) => i.componentName === DRILL_COMPONENT_NAME);

  const results: RawDrillCard[] = [];
  for (const instance of drillInstances) {
    const breadcrumb = await getAncestorNames(instance);
    results.push(toRawDrillCard(instance, breadcrumb));
  }
  return results;
}

/**
 * Every real drill, merged across its Desktop/Tablet/Phone copies. This is what
 * n8n should use to list drills and to identify which one to update -- editing
 * a DrillGroup updates all of its underlying breakpoint instances together, so
 * the site stays consistent across screen sizes.
 */
export async function listDrillGroups(framer: Framer): Promise<DrillGroup[]> {
  const raw = await listRawDrillCards(framer);

  const groups = new Map<string, DrillGroup>();
  for (const card of raw) {
    const key = `${card.program}::${card.day}::${card.block}::${card.exercise}`;
    const existing = groups.get(key);
    if (existing) {
      existing.nodeIds.push(card.id);
      if (card.breakpoint) existing.breakpoints.push(card.breakpoint);
    } else {
      groups.set(key, {
        program: card.program,
        day: card.day,
        block: card.block,
        duration: card.duration,
        exercise: card.exercise,
        coachNotes: card.coachNotes,
        purpose: card.purpose,
        nodeIds: [card.id],
        breakpoints: card.breakpoint ? [card.breakpoint] : [],
      });
    }
  }

  return Array.from(groups.values());
}

export interface DrillUpdateInput {
  duration?: string;
  exercise?: string;
  coachNotes?: string;
  purpose?: string;
}

/**
 * Update a drill by matching its current Program/Day/Block/Exercise, applying
 * the change to every breakpoint copy (Desktop/Tablet/Phone) so the site stays
 * consistent. Returns the updated group, or null if no match was found.
 */
export async function updateDrillGroup(
  framer: Framer,
  match: { program: string; day: string; block: string; exercise: string },
  update: DrillUpdateInput,
): Promise<DrillGroup | null> {
  const instances = await framer.getNodesWithType("ComponentInstanceNode");
  const drillInstances = instances.filter((i) => i.componentName === DRILL_COMPONENT_NAME);

  const toUpdate: ComponentInstanceNode[] = [];
  for (const instance of drillInstances) {
    const breadcrumb = await getAncestorNames(instance);
    const card = toRawDrillCard(instance, breadcrumb);
    if (card.program === match.program && card.day === match.day && card.block === match.block && card.exercise === match.exercise) {
      toUpdate.push(instance);
    }
  }

  if (toUpdate.length === 0) return null;

  // Capture "before" values so the response can show the full merged state,
  // not just whatever fields were passed in.
  const before = toRawDrillCard(toUpdate[0]!, await getAncestorNames(toUpdate[0]!));

  const newControls: Record<string, unknown> = {};
  if (update.duration !== undefined) newControls[CONTROL_KEYS.duration] = update.duration;
  if (update.exercise !== undefined) newControls[CONTROL_KEYS.exercise] = update.exercise;
  if (update.coachNotes !== undefined) newControls[CONTROL_KEYS.coachNotes] = update.coachNotes;
  if (update.purpose !== undefined) newControls[CONTROL_KEYS.purpose] = update.purpose;

  const updatedIds: string[] = [];
  const breakpoints: string[] = [];
  for (const instance of toUpdate) {
    const updated = await instance.setAttributes({ controls: newControls });
    if (updated) {
      updatedIds.push(updated.id);
      const breadcrumb = await getAncestorNames(updated);
      const bp = inferBreakpoint(breadcrumb);
      if (bp) breakpoints.push(bp);
    }
  }

  return {
    program: match.program,
    day: match.day,
    block: match.block,
    duration: update.duration ?? before.duration,
    exercise: update.exercise ?? before.exercise,
    coachNotes: update.coachNotes ?? before.coachNotes,
    purpose: update.purpose ?? before.purpose,
    nodeIds: updatedIds,
    breakpoints,
  };
}


// ---- Bulk randomization ----

export interface RandomizeResultItem {
  program: string | null;
  day: string | null;
  block: string | null;
  before: string | null; // previous exercise name
  after: string | null; // new exercise name
}

/** Fisher-Yates shuffle (non-mutating). */
function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
  }
  return copy;
}

/**
 * Assigns a random drill from `pool` to every card currently on the site,
 * matched by program + block, without repeating a pool drill within the
 * same program+block group (as long as the pool has enough entries for
 * that group -- if not, it wraps around and reuses drills).
 *
 * Every breakpoint copy (Desktop/Tablet/Phone) of each card is updated
 * together, same as a normal single-drill update.
 */
export async function randomizeDrillsFromPool(
  framer: Framer,
  pool: Array<{ program: string; block: string; duration: string; exercise: string; coachNotes: string; purpose: string }>,
): Promise<RandomizeResultItem[]> {
  const currentGroups = await listDrillGroups(framer);

  // Bucket the pool by "program::block" so each site slot draws from the
  // right subset, shuffled once per bucket so slots don't repeat picks.
  const poolBuckets = new Map<string, typeof pool>();
  for (const p of pool) {
    const key = `${p.program}::${p.block}`;
    const bucket = poolBuckets.get(key) ?? [];
    bucket.push(p);
    poolBuckets.set(key, bucket);
  }
  const shuffledBuckets = new Map<string, typeof pool>();
  for (const [key, bucket] of poolBuckets) {
    shuffledBuckets.set(key, shuffled(bucket));
  }
  const cursors = new Map<string, number>();

  const results: RandomizeResultItem[] = [];

  for (const group of currentGroups) {
    const key = `${group.program}::${group.block}`;
    const bucket = shuffledBuckets.get(key);
    if (!bucket || bucket.length === 0) {
      results.push({ program: group.program, day: group.day, block: group.block, before: group.exercise, after: null });
      continue;
    }
    const cursor = cursors.get(key) ?? 0;
    const pick = bucket[cursor % bucket.length]!;
    cursors.set(key, cursor + 1);

    if (!group.program || !group.day || !group.block || !group.exercise) {
      results.push({ program: group.program, day: group.day, block: group.block, before: group.exercise, after: null });
      continue;
    }

    const updated = await updateDrillGroup(
      framer,
      { program: group.program, day: group.day, block: group.block, exercise: group.exercise },
      { duration: pick.duration, exercise: pick.exercise, coachNotes: pick.coachNotes, purpose: pick.purpose },
    );

    results.push({
      program: group.program,
      day: group.day,
      block: group.block,
      before: group.exercise,
      after: updated?.exercise ?? null,
    });
  }

  return results;
}
