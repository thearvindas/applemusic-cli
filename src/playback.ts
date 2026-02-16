/**
 * Playback control: play, pause, toggle, next, prev, stop.
 */

import { run } from "./osascript.js";

export function play(): void {
  run('tell application "APPLICATION" to play');
}

export function pause(): void {
  run('tell application "APPLICATION" to pause');
}

export function toggle(): void {
  const state = run('tell application "APPLICATION" to get player state as string');
  if (state === "playing") {
    pause();
  } else {
    play();
  }
}

export function nextTrack(): void {
  try {
    run('tell application "APPLICATION" to next track');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/next\s*track|can't\s*get.*next|no\s*next/i.test(msg)) {
      throw new Error("No next track.");
    }
    throw e;
  }
}

export function previousTrack(): void {
  try {
    run('tell application "APPLICATION" to previous track');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/previous\s*track|prev\s*track|can't\s*get.*(previous|prev)|no\s*previous/i.test(msg)) {
      throw new Error("No previous track.");
    }
    throw e;
  }
}

export function stop(): void {
  run('tell application "APPLICATION" to stop');
}
