/**
 * Command registry for discovery and help.
 * Each command maps to the same Commander subcommand (name = first token).
 */

import { c } from "./ui.js";

export interface SlashCommandDef {
  name: string;
  description: string;
  argHint?: string;
  group?: "playback" | "now playing" | "output" | "session";
}

export const SLASH_COMMANDS: SlashCommandDef[] = [
  { name: "play", description: "Play a random song, or play by target", argHint: "[album|artist|playlist|genre|song] [name]", group: "playback" },
  { name: "pause", description: "Pause playback", group: "playback" },
  { name: "toggle", description: "Toggle play/pause", group: "playback" },
  { name: "next", description: "Next track", group: "playback" },
  { name: "prev", description: "Previous track", group: "playback" },
  { name: "stop", description: "Stop playback", group: "playback" },
  { name: "np", description: "Show now playing (track, artist, album)", group: "now playing" },
  { name: "status", description: "Alias for np", group: "now playing" },
  { name: "volume", description: "Get or set volume", argHint: "[0-100]", group: "playback" },
  { name: "shuffle", description: "Get or set shuffle", argHint: "[off|songs|albums]", group: "playback" },
  { name: "repeat", description: "Get or set repeat", argHint: "[off|one|all]", group: "playback" },
  { name: "output", description: "List or set AirPlay output device", argHint: "[device name]", group: "output" },
  { name: "help", description: "Show all commands", group: "session" },
];

const GROUP_LABELS: Record<string, string> = {
  playback: "Playback",
  "now playing": "Now playing",
  output: "Output",
  session: "Session",
};

export function filterCommands(prefix: string): SlashCommandDef[] {
  const p = prefix.toLowerCase().trim();
  if (!p) return SLASH_COMMANDS;
  return SLASH_COMMANDS.filter((c) => c.name.startsWith(p) || c.name.includes(p));
}

/** Resolve partial name to full command name, or null if ambiguous/none. */
export function resolveCommand(partial: string): string | null {
  const p = partial.toLowerCase().trim();
  if (!p) return null;
  const exact = SLASH_COMMANDS.find((c) => c.name === p);
  if (exact) return exact.name;
  const byPrefix = SLASH_COMMANDS.filter((c) => c.name.startsWith(p));
  if (byPrefix.length === 1) return byPrefix[0].name;
  if (byPrefix.length > 1) return null;
  return null;
}

export function printCommandList(commands: SlashCommandDef[]): void {
  const byGroup = new Map<string, SlashCommandDef[]>();
  for (const cmd of commands) {
    const g = cmd.group ?? "session";
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(cmd);
  }
  const order = ["playback", "now playing", "output", "session"];
  for (const g of order) {
    const list = byGroup.get(g);
    if (!list?.length) continue;
    console.log("");
    console.log(c.title("  " + GROUP_LABELS[g]));
    console.log(c.muted("  " + "─".repeat(36)));
    for (const cmd of list) {
      const hint = cmd.argHint ? c.dim(" " + cmd.argHint) : "";
      console.log("  " + c.accent(cmd.name) + hint);
    }
  }
  console.log("");
}
