/**
 * Run AppleScript via osascript. Escapes arguments and handles errors.
 * Music.app on Catalina+; iTunes on older macOS.
 */

import { execSync, ExecSyncOptionsWithStringEncoding } from "node:child_process";
import { cleanOsascriptError } from "./errors.js";

const APP_NAME = "Music"; // Catalina+; use "iTunes" for older macOS if needed

const DEFAULT_OPTS: ExecSyncOptionsWithStringEncoding = {
  encoding: "utf-8",
  timeout: 15_000,
  maxBuffer: 1024 * 1024,
};

/**
 * Escape a string for use inside double quotes in AppleScript.
 */
export function escapeForAppleScript(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r");
}

function getStderr(err: unknown): string {
  if (err && typeof err === "object" && "stderr" in err && typeof (err as { stderr?: unknown }).stderr === "string") {
    return (err as { stderr: string }).stderr;
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Run an AppleScript one-liner. Replaces "APPLICATION" with the app name.
 * Always throws a clean Error with a user-friendly message (no stack, no raw stderr).
 */
export function run(script: string, opts: Partial<ExecSyncOptionsWithStringEncoding> = {}): string {
  const full = script.replace(/APPLICATION/g, APP_NAME);
  try {
    return execSync(`osascript -e ${JSON.stringify(full)}`, {
      ...DEFAULT_OPTS,
      stdio: ["pipe", "pipe", "pipe"],
      ...opts,
    }).trim();
  } catch (err: unknown) {
    const stderr = getStderr(err);
    if (stderr.includes("-600") || stderr.includes("isn't running")) {
      throw new Error("Music.app is not running. Open it and try again.");
    }
    throw new Error(cleanOsascriptError(stderr));
  }
}

export { APP_NAME };
