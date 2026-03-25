import type { PlateContent } from "@/types";

/** Recursively strip `undefined` values — Firestore rejects them in nested objects. */
export function stripUndefined<T>(input: T): T {
  if (input === undefined || input === null) return input;
  if (typeof input !== "object") return input;

  if (Array.isArray(input)) {
    return input.map(stripUndefined) as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v !== undefined) out[k] = stripUndefined(v);
  }
  return out as T;
}

export function normalize(nodes: PlateContent): PlateContent {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [{ type: "p", children: [{ text: "" }] }] as unknown as PlateContent;
  }
  return stripUndefined(nodes) as PlateContent;
}

/** Stable string key for a content tree. Call on already-normalized data only. */
export function fingerprint(nodes: PlateContent): string {
  try {
    return JSON.stringify(nodes);
  } catch {
    return "";
  }
}
