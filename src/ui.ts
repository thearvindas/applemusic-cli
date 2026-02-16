/**
 * CLI UI helpers: colors, progress bar, boxes, success toasts, spinner. No TTY = no colors.
 */

import chalk from "chalk";

const isTty = process.stdout.isTTY === true;

function noColor(s: string): string {
  return s;
}

export const c = {
  title: isTty ? chalk.bold.cyan : noColor,
  track: isTty ? chalk.white : noColor,
  muted: isTty ? chalk.gray : noColor,
  dim: isTty ? chalk.dim : noColor,
  /** Slightly brighter than muted/dim for better readability (artist, album). */
  secondary: isTty ? chalk.hex("#a8a8a8") : noColor,
  success: isTty ? chalk.green : noColor,
  error: isTty ? chalk.red : noColor,
  accent: isTty ? chalk.yellow : noColor,
  statePlaying: isTty ? chalk.green : noColor,
  statePaused: isTty ? chalk.yellow : noColor,
  stateStopped: isTty ? chalk.gray : noColor,
};

/** One-line success feedback (e.g. "  ▶ Playing" or "  Volume set to 50"). */
export function successLine(message: string, icon: string = "✓"): void {
  const out = isTty ? c.success(`  ${icon} ${message}`) : `  ${message}`;
  console.log(out);
}

/** Friendly empty state with a suggestion. */
export function emptyState(title: string, suggestion: string): void {
  console.log("");
  console.log(c.muted("  " + title));
  console.log(c.dim("  " + suggestion));
  console.log("");
}

/** Run a sync function after showing a brief "Working..." message; clear line when done (TTY only). */
export function withWorkingMessage<T>(message: string, fn: () => T): T {
  if (isTty) process.stdout.write(c.muted("  … " + message + "\r"));
  const out = fn();
  if (isTty) process.stdout.write("  \r");
  return out;
}


/** Progress bar string: [====    ] 0:45 / 3:20 */
export function progressBar(
  position: number,
  duration: number,
  width: number = 24
): string {
  if (!Number.isFinite(duration) || duration <= 0) return "";
  const pct = Math.min(1, Math.max(0, position / duration));
  const filled = Math.round(width * pct);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return isTty ? chalk.cyan(bar) : bar;
}

/** Horizontal line for boxes */
export function line(width: number = 42): string {
  return "─".repeat(width);
}

/** Top/bottom of a simple box */
export function boxTopBottom(width: number = 44): string {
  return "┌" + "─".repeat(width - 2) + "┐";
}

export function boxBottom(width: number = 44): string {
  return "└" + "─".repeat(width - 2) + "┘";
}

export function boxLine(text: string, width: number = 44): string {
  const pad = width - 2 - text.length;
  const padLeft = Math.max(0, Math.floor(pad / 2));
  const padRight = Math.max(0, pad - padLeft);
  return "│" + " ".repeat(padLeft) + text + " ".repeat(padRight) + "│";
}
