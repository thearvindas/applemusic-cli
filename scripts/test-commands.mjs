#!/usr/bin/env node
/**
 * Smoke test: run every CLI command and check it doesn't crash.
 * Exit 0 or 1 = command ran; timeout or exit > 1 = fail.
 * Usage: node scripts/test-commands.mjs
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const cli = join(root, "dist", "cli.js");

const TIMEOUT_MS = 8000;

const COMMANDS = [
  // Must succeed (no Music needed)
  { args: ["--help"], expect: 0, name: "applemusic-cli --help" },
  { args: ["--version"], expect: 0, name: "applemusic-cli --version" },
  // Playback (may fail if Music.app not running → exit 1 is ok)
  { args: ["play"], expect: [0, 1], name: "applemusic-cli play" },
  { args: ["pause"], expect: [0, 1], name: "applemusic-cli pause" },
  { args: ["toggle"], expect: [0, 1], name: "applemusic-cli toggle" },
  { args: ["next"], expect: [0, 1], name: "applemusic-cli next" },
  { args: ["prev"], expect: [0, 1], name: "applemusic-cli prev" },
  { args: ["stop"], expect: [0, 1], name: "applemusic-cli stop" },
  // Now playing
  { args: ["np"], expect: [0, 1], name: "applemusic-cli np" },
  { args: ["status"], expect: [0, 1], name: "applemusic-cli status" },
  // Volume, shuffle, repeat (get)
  { args: ["volume"], expect: [0, 1], name: "applemusic-cli volume" },
  { args: ["volume", "50"], expect: [0, 1], name: "applemusic-cli volume 50" },
  { args: ["shuffle"], expect: [0, 1], name: "applemusic-cli shuffle" },
  { args: ["shuffle", "off"], expect: [0, 1], name: "applemusic-cli shuffle off" },
  { args: ["repeat"], expect: [0, 1], name: "applemusic-cli repeat" },
  { args: ["repeat", "off"], expect: [0, 1], name: "applemusic-cli repeat off" },
  // Output
  { args: ["output"], expect: [0, 1], name: "applemusic-cli output" },
  // Play by target (may fail: no match or Music not running)
  { args: ["play", "song", "nonexistent123"], expect: [0, 1], name: "applemusic-cli play song nonexistent" },
  { args: ["play", "album", "In Rainbows"], expect: [0, 1], name: "applemusic-cli play album In Rainbows" },
];

function run(name, args) {
  const result = spawnSync("node", [cli, ...args], {
    cwd: root,
    encoding: "utf-8",
    timeout: TIMEOUT_MS,
    env: { ...process.env, FORCE_COLOR: "0" },
  });
  return {
    status: result.status,
    signal: result.signal,
    timedOut: result.signal === "SIGTERM",
    stderr: (result.stderr || "").trim(),
    stdout: (result.stdout || "").trim(),
  };
}

function ok(expect, status, timedOut) {
  if (timedOut) return false;
  const allowed = Array.isArray(expect) ? expect : [expect];
  return allowed.includes(status);
}

let passed = 0;
let failed = 0;

console.log("Testing CLI commands (dist/cli.js)...\n");

for (const { args, expect, name } of COMMANDS) {
  const result = run(name, args);
  const success = ok(expect, result.status, result.timedOut);

  if (success) {
    passed++;
    console.log(`  \u2713 ${name}`);
  } else {
    failed++;
    console.log(`  \u2717 ${name}`);
    if (result.timedOut) console.log("      timeout");
    else if (result.signal) console.log(`      signal: ${result.signal}`);
    else console.log(`      exit code: ${result.status}`);
    if (result.stderr) console.log(`      stderr: ${result.stderr.slice(0, 120)}`);
  }
}

console.log("\n---");
console.log(`Passed: ${passed}  Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
}
