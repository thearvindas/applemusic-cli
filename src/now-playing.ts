/**
 * Now playing: current track info (name, artist, album, duration, position).
 */

import { run } from "./osascript.js";
import { getArtworkPath, imageToBlockArt } from "./artwork.js";
import { getRepeat } from "./repeat.js";
import { c, emptyState, line, progressBar } from "./ui.js";

export interface NowPlayingInfo {
  state: "playing" | "paused" | "stopped";
  name: string;
  artist: string;
  album: string;
  duration: number; // seconds
  position: number; // seconds
}

function getString(script: string): string {
  try {
    const out = run(script);
    return out === "" ? "—" : out;
  } catch {
    return "—";
  }
}

function getNumber(script: string): number {
  try {
    const out = run(script);
    const n = Number(out);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

/** Get current player state only (for resume vs play-random). Returns null if Music not running or error. */
export function getPlayerState(): "playing" | "paused" | "stopped" | null {
  try {
    const state = run(
      'tell application "APPLICATION" to get player state as string'
    ).toLowerCase();
    if (state === "playing" || state === "paused" || state === "stopped") {
      return state;
    }
    return null;
  } catch {
    return null;
  }
}

export function getNowPlaying(): NowPlayingInfo | null {
  try {
    const state = run(
      'tell application "APPLICATION" to get player state as string'
    ).toLowerCase() as "playing" | "paused" | "stopped";
    const name = getString(
      'tell application "APPLICATION" to get name of current track'
    );
    const artist = getString(
      'tell application "APPLICATION" to get artist of current track'
    );
    const album = getString(
      'tell application "APPLICATION" to get album of current track'
    );
    const duration = getNumber(
      'tell application "APPLICATION" to get duration of current track'
    );
    const position = getNumber(
      'tell application "APPLICATION" to get player position'
    );
    return { state, name, artist, album, duration, position };
  } catch {
    return null;
  }
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export async function printNowPlaying(): Promise<void> {
  const info = getNowPlaying();
  if (!info) {
    emptyState("Nothing playing.", "Try /play or applemusic-cli play to start, or play a song/album with applemusic-cli play \"Name\".");
    return;
  }
  const artPath = getArtworkPath();
  const blockArt = artPath ? await imageToBlockArt(artPath) : null;
  const pos = formatDuration(info.position);
  const dur = formatDuration(info.duration);
  const stateLabel =
    info.state === "playing"
      ? c.statePlaying("▶ playing")
      : info.state === "paused"
        ? c.statePaused("‖ paused")
        : c.stateStopped("■ stopped");
  const bar = progressBar(info.position, info.duration);
  let repeatLabel = "off";
  try {
    repeatLabel = getRepeat();
  } catch {
    // ignore
  }
  console.log("");
  console.log(c.title("  now playing"));
  console.log(c.muted("  " + line(38)));
  if (blockArt) {
    blockArt.split("\n").forEach((row) => console.log("  " + row));
    console.log("");
  }
  console.log("  " + c.track(info.name));
  console.log("  " + c.secondary(info.artist));
  if (info.album !== "—") console.log("  " + c.secondary(info.album));
  console.log("");
  if (bar) console.log("  " + bar);
  console.log("  " + c.muted(`${pos} / ${dur}  ·  ${stateLabel}  ·  repeat: ${repeatLabel}`));
  console.log("");
}
