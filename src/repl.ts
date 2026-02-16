/**
 * Interactive REPL: readline loop, parse command [args], dispatch to Commander.
 * No slash required: type "play", "np", etc. Empty line or "help" shows all commands.
 */

import * as readline from "node:readline";
import type { Command } from "commander";
import { filterCommands, printCommandList, resolveCommand, SLASH_COMMANDS } from "./commands.js";
import { friendlyMessage } from "./errors.js";
import { c } from "./ui.js";

const PROMPT = "applemusic-cli> ";

function completer(line: string): readline.CompleterResult {
  const trimmed = line.trim();
  const first = trimmed.split(/\s+/)[0] ?? "";
  const prefix = first.toLowerCase();
  const hits = SLASH_COMMANDS
    .filter((cmd) => cmd.name.startsWith(prefix))
    .map((cmd) => cmd.name);
  return [hits.length ? hits : [], prefix];
}

export function runRepl(program: Command): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
  });
  rl.on("close", () => process.exit(0));

  function prompt(): void {
    rl.question(PROMPT, (line) => {
      const trimmed = line.trim();
      const rest = trimmed.startsWith("/") ? trimmed.slice(1).trim() : trimmed;
      const parts = rest ? rest.split(/\s+/) : [];
      const commandName = parts[0]?.toLowerCase() ?? "";

      if (!trimmed || !commandName) {
        console.log("");
        console.log(c.title("  Commands"));
        console.log(c.muted("  " + "─".repeat(36)));
        printCommandList(SLASH_COMMANDS);
        console.log("");
        prompt();
        return;
      }

      if (commandName === "exit" || commandName === "quit") {
        rl.close();
        return;
      }
      if (commandName === "help" || commandName === "?") {
        const filter = parts.length > 1 ? parts[1] : "";
        const matches = filterCommands(filter);
        console.log("");
        console.log(c.title("  Commands"));
        console.log(c.muted("  " + "─".repeat(36)));
        printCommandList(matches.length ? matches : SLASH_COMMANDS);
        console.log("");
        prompt();
        return;
      }

      const resolved = resolveCommand(commandName);
      if (!resolved) {
        const matches = filterCommands(commandName);
        if (matches.length > 1) {
          console.log(c.muted(`Ambiguous: "${commandName}" matches: ${matches.map((m) => m.name).join(", ")}`));
        } else {
          console.log(c.muted(`Unknown command: ${commandName}. Type help or press Enter for list.`));
        }
        console.log("");
        prompt();
        return;
      }

      const args = [resolved, ...parts.slice(1)];
      const parseArgv = [process.argv[0], process.argv[1], ...args];
      const origExit = process.exit;
      process.exit = ((code?: number) => {
        if (typeof code === "number" && code !== 0) throw new Error(`EXIT:${code}`);
        origExit(code);
      }) as typeof process.exit;
      (async () => {
        try {
          await program.parseAsync(parseArgv);
        } catch (err) {
          if (err instanceof Error && err.message.startsWith("EXIT:")) {
            // command already printed error
          } else {
            console.error(friendlyMessage(err));
          }
        } finally {
          process.exit = origExit;
          console.log("");
          prompt();
        }
      })();
    });
  }

  console.log("");
  console.log(c.title("  Apple Music CLI"));
  console.log(c.muted("  Type a command (e.g. play, np). Enter or help for list · exit to quit"));
  console.log(c.dim("  ↑↓ history   Tab complete   help"));
  console.log("");
  prompt();
}
