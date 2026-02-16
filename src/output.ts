/**
 * AirPlay / output device: list devices, set Music output.
 */

import { run, escapeForAppleScript } from "./osascript.js";

export function listOutputDevices(): string[] {
  try {
    const out = run(`
      tell application "APPLICATION"
        set names to name of every AirPlay device
        set text item delimiters to "\\n"
        return names as text
      end tell
    `);
    if (!out.trim()) return [];
    return out.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

export function getSelectedDevice(): string | null {
  try {
    const devices = listOutputDevices();
    for (const name of devices) {
      const selected = run(`
        tell application "APPLICATION"
          get selected of AirPlay device "${escapeForAppleScript(name)}"
        end tell
      `);
      if (selected.toLowerCase() === "true") return name;
    }
    return null;
  } catch {
    return null;
  }
}

export function setOutputDevice(deviceName: string): void {
  try {
    const name = escapeForAppleScript(deviceName);
    run(`
    tell application "APPLICATION"
      set selected of AirPlay device "${name}" to true
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No output device named "${deviceName}" found. Run \`applemusic-cli output\` to list devices.`);
  }
}

export function toggleOutputDevice(deviceName: string): void {
  const name = escapeForAppleScript(deviceName);
  const selected = run(`
    tell application "APPLICATION"
      get selected of AirPlay device "${name}"
    end tell
  `);
  const isActive = selected.toLowerCase() === "true";
  run(`
    tell application "APPLICATION"
      set selected of AirPlay device "${name}" to ${isActive ? "false" : "true"}
    end tell
  `);
}
