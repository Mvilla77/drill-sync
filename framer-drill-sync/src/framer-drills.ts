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
  id: string; // stable identifier (the Desktop instance's raw id) -- never changes, unlike exercise text
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

// Confirmed against the live project: the Tablet and Phone copy of a given
// card share the Desktop copy's raw id, just prefixed. This lets us group
// a card's 3 breakpoint copies together by ID STRUCTURE, which never
// changes -- instead of by matching their exercise text, which can be
// briefly stale right after another update (exactly the field we're
// changing). If this project's breakpoint prefixes ever change, re-check
// via GET /drills/raw and update this map.
const BREAKPOINT_ID_PREFIXES: Record<string, string> = {
  Tablet: "ghmz8FG4f",
  Phone: "jjITxzS6E",
};

function baseIdOf(nodeId: string, breakpoint: string | null): string {
  if (breakpoint) {
    const prefix = BREAKPOINT_ID_PREFIXES[breakpoint];
    if (prefix && nodeId.startsWith(prefix)) {
      return nodeId.slice(prefix.length);
    }
  }
  return nodeId; // Desktop has no prefix -- its raw id IS the base id
}

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
    const key = baseIdOf(card.id, card.breakpoint);
    const existing = groups.get(key);
    if (existing) {
      existing.nodeIds.push(card.id);
      if (card.breakpoint) existing.breakpoints.push(card.breakpoint);
      // Prefer the Desktop copy's own values if this card IS the Desktop
      // copy (in case breakpoints have briefly diverged mid-update).
      if (card.breakpoint === "Desktop") {
        existing.duration = card.duration;
        existing.exercise = card.exercise;
        existing.coachNotes = card.coachNotes;
        existing.purpose = card.purpose;
      }
    } else {
      groups.set(key, {
        id: key,
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
    id: baseIdOf(toUpdate[0]!.id, before.breakpoint),
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

// ---- Fast bulk update (single fetch, not one fetch per update) ----

export interface BulkUpdateRequest {
  id: string; // stable id from GET /drills (DrillGroup.id) -- NOT the exercise name
}

export interface BulkUpdateResultItem {
  drill?: DrillGroup;
  error?: string;
  input?: unknown;
}

/**
 * Applies several updates in a single pass: fetches every Drill Card
 * instance (with live node references) ONCE, then matches each requested
 * update against that in-memory list before calling setAttributes. This is
 * what makes /drills/bulk fast -- the naive approach of calling
 * updateDrillGroup() once per update re-fetches and re-walks the entire
 * node tree every time, which is extremely slow for 15-20+ updates.
 *
 * Matching is by stable `id` (see DrillGroup.id / baseIdOf), NOT by
 * program/day/block/exercise text -- text matching is fragile here because
 * `exercise` is exactly the field being changed, so a value captured by an
 * earlier GET /drills call can be stale by the time this runs. The id never
 * changes regardless of content.
 */
export async function bulkUpdateDrills(
  framer: Framer,
  updates: Array<BulkUpdateRequest & DrillUpdateInput>,
): Promise<BulkUpdateResultItem[]> {
  // One fetch + one ancestor-walk for every instance, done ONCE for the
  // whole batch (this is the expensive part -- ~60 instances x a few
  // getParent() calls each -- so doing it once instead of 20 times is
  // the entire fix).
  const instances = await framer.getNodesWithType("ComponentInstanceNode");
  const drillInstances = instances.filter((i) => i.componentName === DRILL_COMPONENT_NAME);

  const withCards: Array<{ instance: ComponentInstanceNode; card: RawDrillCard; baseId: string }> = [];
  for (const instance of drillInstances) {
    const breadcrumb = await getAncestorNames(instance);
    const card = toRawDrillCard(instance, breadcrumb);
    withCards.push({ instance, card, baseId: baseIdOf(card.id, card.breakpoint) });
  }

  const results: BulkUpdateResultItem[] = [];

  for (const u of updates) {
    const { id, ...rest } = u;
    if (!id) {
      results.push({ error: "Missing id", input: u });
      continue;
    }

    // In-memory match -- no API call here, just filtering the list we
    // already have. Matches all breakpoint copies sharing this base id.
    const matches = withCards.filter((wc) => wc.baseId === id);

    if (matches.length === 0) {
      results.push({ error: "Drill not found (id did not match any card -- run GET /drills again to get fresh ids)", input: u });
      continue;
    }

    const cleanUpdate: DrillUpdateInput = {};
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === "string" && value.trim() !== "") {
        (cleanUpdate as Record<string, string>)[key] = value;
      }
    }

    const newControls: Record<string, unknown> = {};
    if (cleanUpdate.duration !== undefined) newControls[CONTROL_KEYS.duration] = cleanUpdate.duration;
    if (cleanUpdate.exercise !== undefined) newControls[CONTROL_KEYS.exercise] = cleanUpdate.exercise;
    if (cleanUpdate.coachNotes !== undefined) newControls[CONTROL_KEYS.coachNotes] = cleanUpdate.coachNotes;
    if (cleanUpdate.purpose !== undefined) newControls[CONTROL_KEYS.purpose] = cleanUpdate.purpose;

    // This part still needs one real API call per breakpoint copy (usually
    // 3) -- that's unavoidable, it's the actual write. What we've cut out
    // is redundantly re-discovering all 60 instances before every write.
    const updatedIds: string[] = [];
    const breakpoints: string[] = [];
    for (const match of matches) {
      const updated = await match.instance.setAttributes({ controls: newControls });
      if (updated) {
        updatedIds.push(updated.id);
        if (match.card.breakpoint) breakpoints.push(match.card.breakpoint);
      }
    }

    const first = matches[0]!;
    results.push({
      drill: {
        id,
        program: first.card.program,
        day: first.card.day,
        block: first.card.block,
        duration: cleanUpdate.duration ?? first.card.duration,
        exercise: cleanUpdate.exercise ?? first.card.exercise,
        coachNotes: cleanUpdate.coachNotes ?? first.card.coachNotes,
        purpose: cleanUpdate.purpose ?? first.card.purpose,
        nodeIds: updatedIds,
        breakpoints,
      },
    });
  }

  return results;
}
