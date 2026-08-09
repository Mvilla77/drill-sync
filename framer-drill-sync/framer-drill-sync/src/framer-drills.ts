import { connect, type Framer, type ComponentInstanceNode, type AnyNode } from "framer-api";

const PROJECT_URL = process.env["FRAMER_PROJECT_URL"];
const API_KEY = process.env["FRAMER_API_KEY"];

if (!PROJECT_URL) throw new Error("FRAMER_PROJECT_URL env var is required");
if (!API_KEY) throw new Error("FRAMER_API_KEY env var is required");

// Name of the design component as it appears in Framer (Assets panel / instance name).
// If your component is named differently, update this.
export const DRILL_COMPONENT_NAME = "Drill Card";

export interface DrillCard {
  id: string;
  program: string | null; // e.g. "Adult Class" / "Youth Class" (inferred from ancestor group names)
  day: string | null; // e.g. "Monday" / "Wednesday"
  block: string | null; // e.g. "Adult Footwork Block", "Controlled Fencing", "Open Fencing"
  breadcrumb: string[]; // full ancestor chain, root -> instance, for debugging
  duration: string | null;
  exercise: string | null;
  coachNotes: string | null;
  purpose: string | null;
  rawControls: Record<string, unknown>; // the untouched controls object, for debugging key names
}

// Known day names / program markers to recognise inside the ancestor chain.
const DAY_NAMES = ["Monday", "Wednesday"];
const PROGRAM_MARKERS = ["Adult", "Youth"];

/** Connect to the Framer project. Caller is responsible for calling framer.disconnect(). */
export async function connectFramer(): Promise<Framer> {
  return connect(PROJECT_URL as string, API_KEY as string);
}

/** Normalise a string for loose matching: lowercase, strip spaces/underscores. */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[\s_-]/g, "");
}

/**
 * Pull a value out of a controls object by loosely matching a human label
 * (e.g. "Coach Notes" matches a control key of "coachNotes" or "coach_notes").
 */
function readControl(controls: Record<string, unknown>, ...labels: string[]): string | null {
  const target = labels.map(normalise);
  for (const [key, value] of Object.entries(controls)) {
    if (target.includes(normalise(key)) && typeof value === "string") {
      return value;
    }
  }
  return null;
}

/** Walk from a node up to the root, collecting ancestor names (excluding the node itself). */
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

function inferBlock(breadcrumb: string[], day: string | null): string | null {
  // The block is usually the group directly under the Day group
  // (e.g. "Adult Footwork Block", "Adult Controlled Fencing", "Adult Open Fencing").
  const dayIndex = day ? breadcrumb.findIndex((n) => n === day) : -1;
  if (dayIndex >= 0 && breadcrumb.length > dayIndex + 1) {
    return breadcrumb[dayIndex + 1] ?? null;
  }
  return null;
}

function toDrillCard(instance: ComponentInstanceNode, breadcrumb: string[]): DrillCard {
  const controls = instance.controls ?? {};
  const day = inferDay(breadcrumb);
  return {
    id: instance.id,
    program: inferProgram(breadcrumb),
    day,
    block: inferBlock(breadcrumb, day),
    breadcrumb,
    duration: readControl(controls, "Duration"),
    exercise: readControl(controls, "Exercise", "Name"),
    coachNotes: readControl(controls, "Coach Notes", "Coach Instructions", "What the Coach Does"),
    purpose: readControl(controls, "Purpose"),
    rawControls: controls,
  };
}

/** Fetch every Drill Card instance in the project, with inferred Program/Day/Block context. */
export async function listDrillCards(framer: Framer): Promise<DrillCard[]> {
  const instances = await framer.getNodesWithType("ComponentInstanceNode");
  const drillInstances = instances.filter((i) => i.componentName === DRILL_COMPONENT_NAME);

  const results: DrillCard[] = [];
  for (const instance of drillInstances) {
    const breadcrumb = await getAncestorNames(instance);
    results.push(toDrillCard(instance, breadcrumb));
  }
  return results;
}

export interface DrillUpdateInput {
  duration?: string;
  exercise?: string;
  coachNotes?: string;
  purpose?: string;
}

/**
 * Update a single Drill Card instance by id. Only fields present in `update` are changed.
 * Matches your field names to whatever the real control keys are (see rawControls from
 * `npm run discover` if this ever needs adjusting).
 */
export async function updateDrillCard(
  framer: Framer,
  nodeId: string,
  update: DrillUpdateInput,
): Promise<DrillCard | null> {
  const instances = await framer.getNodesWithType("ComponentInstanceNode");
  const instance = instances.find((i) => i.id === nodeId && i.componentName === DRILL_COMPONENT_NAME);
  if (!instance) return null;

  const currentControls = instance.controls ?? {};
  const newControls: Record<string, unknown> = {};

  const fieldLabels: Array<[keyof DrillUpdateInput, string[]]> = [
    ["duration", ["Duration"]],
    ["exercise", ["Exercise", "Name"]],
    ["coachNotes", ["Coach Notes", "Coach Instructions", "What the Coach Does"]],
    ["purpose", ["Purpose"]],
  ];

  for (const [field, labels] of fieldLabels) {
    const value = update[field];
    if (value === undefined) continue;
    const target = labels.map(normalise);
    const matchedKey = Object.keys(currentControls).find((k) => target.includes(normalise(k)));
    if (matchedKey) {
      newControls[matchedKey] = value;
    } else {
      // Fall back to the first label as the key -- this only matters if discovery
      // ever finds a card with a missing/renamed control.
      newControls[labels[0] as string] = value;
    }
  }

  const updated = await instance.setAttributes({ controls: newControls });
  if (!updated) return null;

  const breadcrumb = await getAncestorNames(updated);
  return toDrillCard(updated, breadcrumb);
}
