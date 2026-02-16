/**
 * Album artwork: save current track art to temp file, convert to ASCII.
 * 1) AppleScript (library tracks only; URL/streaming tracks don't expose data).
 * 2) media-control CLI (MediaRemote), when installed: brew install media-control
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run, escapeForAppleScript } from "./osascript.js";

const MEDIA_CONTROL_CANDIDATES = [
  "media-control",
  "/opt/homebrew/bin/media-control",
  "/usr/local/bin/media-control",
];

function getMediaControlPath(): string | null {
  for (const candidate of MEDIA_CONTROL_CANDIDATES) {
    if (candidate === "media-control") {
      try {
        execSync("which media-control", { stdio: "pipe" });
        return candidate;
      } catch {
        continue;
      }
    }
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const ARTWORK_WIDTH = 28;
// Terminal cells are ~2:1 height:width, so use half the rows for a visual square
const ARTWORK_HEIGHT = 14;
// Classic terminal-art palette: you see the characters, not a smooth image
const CHARS = " .':-=+*#%@";

/**
 * Save current track's artwork to a temp file. Returns path or null.
 * Music.app does not expose artwork data for URL tracks (streaming); only library
 * tracks can provide image bytes via AppleScript.
 */
export function saveArtworkToTempFile(): string | null {
  try {
    const cls = run('tell application "APPLICATION" to get class of current track as string').toLowerCase();
    if (cls.includes("url")) return null;
  } catch {
    return null;
  }
  const artPath = join(tmpdir(), "am-cli-artwork.jpg");
  const writeBlock = `
    set outPath to "${escapeForAppleScript(artPath)}"
    set fileRef to open for access (POSIX file outPath) with write permission
    set eof fileRef to 0
    write srcBytes to fileRef
    close access fileRef
  `;
  // For library tracks only: try "data" then "raw data" (URL tracks give -50 / -1728).
  const variants: Array<{ target: string; prop: string }> = [
    { target: "artwork 1 of current track", prop: "data" },
    { target: "first artwork of current track", prop: "data" },
    { target: "artwork 1 of current track", prop: "raw data" },
    { target: "first artwork of current track", prop: "raw data" },
  ];
  for (const { target, prop } of variants) {
    try {
      const script = `
        tell application "APPLICATION"
          set srcBytes to (get ${prop} of ${target})
        end tell
        ${writeBlock}
      `;
      run(script);
      return artPath;
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Get artwork via media-control CLI (MediaRemote — same source as Now Playing widget).
 * Works for streaming/URL tracks when media-control is installed: brew install media-control
 * Returns path to temp image file or null.
 */
export function getArtworkViaMediaControl(): string | null {
  const bin = getMediaControlPath();
  if (!bin) return null;
  try {
    const out = execSync(`${bin} get`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
    const data = JSON.parse(out) as { artworkData?: string };
    if (!data?.artworkData) return null;
    const buf = Buffer.from(data.artworkData, "base64");
    if (buf.length === 0) return null;
    const artPath = join(tmpdir(), "am-cli-artwork-mr.jpg");
    writeFileSync(artPath, buf);
    return artPath;
  } catch {
    return null;
  }
}

/** For diagnostics: is media-control available, and where? */
export function getMediaControlStatus(): { found: boolean; path: string | null } {
  const path = getMediaControlPath();
  return { found: !!path, path: path || null };
}

/**
 * Get artwork: try AppleScript first, then media-control if available.
 */
export function getArtworkPath(): string | null {
  return saveArtworkToTempFile() ?? getArtworkViaMediaControl();
}

/** Return current track class (e.g. "URL track") or null. */
export function getCurrentTrackClass(): string | null {
  try {
    return run('tell application "APPLICATION" to get class of current track as string');
  } catch {
    return null;
  }
}

/**
 * Convert image to terminal art: one character per pixel, no colors.
 * Uses half the rows (ARTWORK_HEIGHT) so the block looks square in the terminal (cells are ~2:1 tall).
 */
export async function imageToBlockArt(imagePath: string): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const { data, info } = await sharp(imagePath)
      .resize(ARTWORK_WIDTH, ARTWORK_HEIGHT)
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const lines: string[] = [];
    for (let y = 0; y < h; y++) {
      let line = "";
      for (let x = 0; x < w; x++) {
        const v = data[y * w + x];
        const i = Math.min(Math.floor((v / 256) * CHARS.length), CHARS.length - 1);
        line += CHARS[i];
      }
      lines.push(line);
    }
    return lines.join("\n");
  } catch {
    return null;
  }
}
