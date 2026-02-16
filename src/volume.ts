/**
 * Music.app volume: get or set (0–100). Validates: whole numbers only.
 */

import { run } from "./osascript.js";

export function getVolume(): number {
  const out = run('tell application "APPLICATION" to get sound volume');
  const n = Number(out);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

export function setVolume(level: number): void {
  if (!Number.isFinite(level)) {
    throw new Error("Volume must be a whole number from 0 to 100 (e.g. 50).");
  }
  const rounded = Math.round(level);
  if (rounded !== level) {
    throw new Error("Volume must be a whole number from 0 to 100 (e.g. 50).");
  }
  if (rounded < 0 || rounded > 100) {
    throw new Error("Volume must be between 0 and 100.");
  }
  run(`tell application "APPLICATION" to set sound volume to ${rounded}`);
}
