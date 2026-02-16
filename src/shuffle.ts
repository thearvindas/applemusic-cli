/**
 * Shuffle: get/set (off | songs | albums).
 */

import { run } from "./osascript.js";

export type ShuffleMode = "off" | "songs" | "albums";

const MODE_MAP: Record<string, ShuffleMode> = {
  off: "off",
  none: "off",
  false: "off",
  songs: "songs",
  song: "songs",
  albums: "albums",
  album: "albums",
};

export function getShuffle(): { enabled: boolean; mode: ShuffleMode } {
  const enabled =
    run('tell application "APPLICATION" to get shuffle enabled').toLowerCase() === "true";
  const modeRaw = run('tell application "APPLICATION" to get shuffle mode as string').toLowerCase();
  const mode = MODE_MAP[modeRaw] ?? (enabled ? "songs" : "off");
  return { enabled, mode };
}

export function setShuffle(mode: ShuffleMode): void {
  if (mode === "off") {
    run('tell application "APPLICATION" to set shuffle enabled to false');
    return;
  }
  run('tell application "APPLICATION" to set shuffle enabled to true');
  const scriptMode = mode === "albums" ? "albums" : "songs";
  run(`tell application "APPLICATION" to set shuffle mode to ${scriptMode}`);
}
