/**
 * Repeat: get/set (off | one | all).
 */

import { run } from "./osascript.js";

export type RepeatMode = "off" | "one" | "all";

const MODE_MAP: Record<string, RepeatMode> = {
  off: "off",
  none: "off",
  false: "off",
  one: "one",
  single: "one",
  all: "all",
  playlist: "all",
  true: "all",
};

export function getRepeat(): RepeatMode {
  const raw = run('tell application "APPLICATION" to get song repeat as string').toLowerCase();
  return MODE_MAP[raw] ?? "off";
}

export function setRepeat(mode: RepeatMode): void {
  const scriptMode = mode === "off" ? "off" : mode === "one" ? "one" : "all";
  run(`tell application "APPLICATION" to set song repeat to ${scriptMode}`);
}
