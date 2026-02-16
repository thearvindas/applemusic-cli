/**
 * Centralized error handling: friendly messages only, no stack traces.
 */

/**
 * Return a one-line message safe to show the user. Never exposes stack or raw errors.
 * Strips stack traces (lines like "    at ...") from Error.message.
 */
export function friendlyMessage(err: unknown): string {
  let msg: string;
  if (err instanceof Error && err.message) {
    msg = err.message;
  } else if (typeof err === "string") {
    msg = err;
  } else {
    return "Something went wrong.";
  }
  const firstLine = msg.split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "Something went wrong.";
  if (firstLine.startsWith("    at ") || firstLine.startsWith("at ")) return "Something went wrong.";
  return firstLine;
}

/**
 * Print the friendly message to stderr and exit with 1.
 */
export function exitWithError(err: unknown): never {
  console.error(friendlyMessage(err));
  process.exit(1);
}

/**
 * Normalize osascript stderr into a short message (no "Command failed:", no exit code).
 * Maps known Music errors to friendly text.
 */
export function cleanOsascriptError(stderr: string): string {
  const trimmed = stderr.trim();
  if (!trimmed) return "Music.app couldn't complete that request.";
  const firstLine = trimmed.split(/\r?\n/)[0] ?? trimmed;
  const cleaned = firstLine
    .replace(/^\d+:\d+:\s*execution error:\s*/i, "")
    .replace(/^Music got an error:\s*/i, "")
    .replace(/\s*\(-?\d+\)\s*$/, "")
    .trim();
  if (cleaned.toLowerCase().includes("can't make") || cleaned.includes("-1700")) {
    return "Music.app couldn't find or play that. Try a different name or check your library.";
  }
  if (cleaned.toLowerCase().includes("can't get") || cleaned.includes("expected type")) {
    return "Music.app couldn't find that. Check the name and try again.";
  }
  return cleaned || "Music.app couldn't complete that request.";
}
