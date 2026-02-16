/**
 * Queue: current track + what's next (remaining tracks in the playing playlist, when available).
 * Music.app doesn't expose the full "Up Next" queue via AppleScript; we show remaining tracks
 * in the current playing context when possible.
 */

import { run } from "./osascript.js";
import { getNowPlaying } from "./now-playing.js";
import { c, emptyState, line } from "./ui.js";

export interface QueueTrack {
  name: string;
  artist: string;
}

function getString(script: string): string {
  try {
    const out = run(script);
    return out === "" ? "—" : out;
  } catch {
    return "—";
  }
}

/** Get names of tracks after the current one in the playing playlist (best-effort). */
function getNextTrackNames(max: number = 10): QueueTrack[] {
  const result: QueueTrack[] = [];
  try {
    // Get index of current track in its playlist and the playlist's track count.
    const script = `
      tell application "APPLICATION"
        set currentTrack to current track
        set trackIndex to index of currentTrack
        try
          set pl to container of currentTrack
          set total to count of tracks of pl
          set out to ""
          set text item delimiters to "|||"
          set i to trackIndex
          set c to 0
          repeat while i < total and c < ${max}
            set t to track (i + 1) of pl
            set out to out & (name of t) & "::" & (artist of t) & "|||"
            set i to i + 1
            set c to c + 1
          end repeat
          return out
        on error
          return ""
        end try
      end tell
    `;
    const raw = run(script);
    if (!raw.trim()) return result;
    const blocks = raw.split("|||").filter(Boolean);
    for (const block of blocks) {
      const [name = "—", artist = "—"] = block.split("::");
      result.push({ name: name.trim(), artist: artist.trim() });
    }
  } catch {
    // ignore
  }
  return result;
}

export function getQueue(): { current: ReturnType<typeof getNowPlaying>; next: QueueTrack[] } {
  const current = getNowPlaying();
  const next = getNextTrackNames(15);
  return { current, next };
}

export function printQueue(): void {
  const { current, next } = getQueue();
  console.log("");
  console.log(c.title("  queue"));
  console.log(c.muted("  " + line(38)));
  if (!current) {
    emptyState("Nothing playing.", "Start something with /play or applemusic-cli play to see the queue.");
    return;
  }
  const stateLabel =
    current.state === "playing"
      ? c.statePlaying("▶ now")
      : current.state === "paused"
        ? c.statePaused("‖ now")
        : c.stateStopped("■ now");
  console.log("  " + stateLabel + "  " + c.track(current.name) + c.muted(" — " + current.artist));
  if (next.length === 0) {
    console.log("");
    console.log(c.dim("  Nothing else in queue (or playing from a single track)."));
    console.log("");
    return;
  }
  console.log("");
  console.log(c.muted("  up next"));
  const w = String(next.length).length;
  next.forEach((t, i) => {
    const num = String(i + 1).padStart(w);
    console.log("  " + c.dim(num + ".") + " " + t.name + c.muted(" — " + t.artist));
  });
  console.log("");
}
