#!/usr/bin/env node

import { Command } from "commander";
import { exitWithError, friendlyMessage } from "./errors.js";
import * as playback from "./playback.js";
import { getNowPlaying, getPlayerState, printNowPlaying } from "./now-playing.js";
import * as volume from "./volume.js";
import * as shuffle from "./shuffle.js";
import * as repeat from "./repeat.js";
import * as library from "./library.js";
import * as output from "./output.js";
import { runRepl } from "./repl.js";
import {
  getArtworkViaMediaControl,
  getCurrentTrackClass,
  getMediaControlStatus,
  saveArtworkToTempFile,
} from "./artwork.js";
import { c, emptyState, successLine, withWorkingMessage } from "./ui.js";

process.on("uncaughtException", (err: unknown) => {
  console.error(friendlyMessage(err));
  process.exit(1);
});

const program = new Command();

program
  .name("applemusic-cli")
  .description("Apple Music CLI – control Music.app from the terminal (local only)")
  .version("0.1.0");

program
  .command("play")
  .description("Play a random song, or play by target: play album|artist|playlist|genre|song <name>")
  .argument("[type]", "album | artist | playlist | genre | song")
  .argument("[name...]", "name to match (e.g. album name)")
  .action((type: string | undefined, nameParts: string[] | undefined) => {
    if (!type && (!nameParts || !nameParts.length)) {
      try {
        const state = getPlayerState();
        if (state === "paused") {
          playback.play();
          successLine("Resumed", "▶");
          return;
        }
        withWorkingMessage("Picking a random song…", () => library.playRandomSong());
        successLine("Playing random song", "▶");
      } catch (e) {
        exitWithError(e);
      }
      return;
    }
    if (!type || !nameParts?.length) {
      exitWithError(new Error("Usage: applemusic-cli play  OR  applemusic-cli play album \"In Rainbows\"  (album|artist|playlist|genre|song)"));
    }
    const name = nameParts.join(" ");
    const t = type.toLowerCase();
    const knownTypes = ["album", "artist", "playlist", "genre", "song"];
    const isType = knownTypes.includes(t);
    const targetName = isType ? name : [type, ...(nameParts ?? [])].join(" ");
    if (isType && !name) {
      exitWithError(new Error("Usage: applemusic-cli play album \"In Rainbows\"  (or artist, playlist, genre, song)"));
    }
    const label = isType ? t : "song";
    try {
      withWorkingMessage(`Playing ${label}…`, () => {
        if (t === "album") library.playAlbum(targetName);
        else if (t === "artist") library.playArtist(targetName);
        else if (t === "playlist") library.playPlaylist(targetName);
        else if (t === "genre") library.playGenre(targetName);
        else if (t === "song" || !isType) library.playSong(targetName);
        else exitWithError(new Error("Type must be: album, artist, playlist, genre, or song"));
      });
      successLine(`Playing ${label}: ${targetName}`, "▶");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("pause")
  .description("Pause playback")
  .action(() => {
    try {
      playback.pause();
      successLine("Paused", "‖");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("toggle")
  .description("Toggle play/pause")
  .action(() => {
    try {
      playback.toggle();
      successLine("Toggled", "▶");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("next")
  .description("Next track")
  .action(async () => {
    try {
      playback.nextTrack();
      successLine("Next track", "→");
      await printNowPlaying();
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("prev")
  .description("Previous track")
  .action(async () => {
    try {
      playback.previousTrack();
      successLine("Previous track", "←");
      await printNowPlaying();
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("stop")
  .description("Stop playback")
  .action(() => {
    try {
      playback.stop();
      successLine("Stopped", "■");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("np")
  .description("Show now playing (track, artist, album, position)")
  .action(async () => {
    try {
      await printNowPlaying();
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("status")
  .description("Alias for np")
  .action(async () => {
    try {
      await printNowPlaying();
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("volume")
  .description("Get or set volume (0-100)")
  .argument("[level]", "Volume level 0-100")
  .action((level: string | undefined) => {
    if (level === undefined) {
      try {
        console.log(volume.getVolume());
      } catch (e) {
        exitWithError(e);
      }
      return;
    }
    const n = Number(level);
    if (!Number.isFinite(n) || n < 0 || n > 100 || !Number.isInteger(n)) {
      exitWithError(new Error("Volume must be a whole number from 0 to 100 (e.g. 50)."));
    }
    try {
      volume.setVolume(n);
      successLine(`Volume ${volume.getVolume()}`, "◉");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("shuffle")
  .description("Get or set shuffle (off | songs | albums)")
  .argument("[mode]", "off, songs, or albums")
  .action((mode: string | undefined) => {
    if (mode === undefined) {
      try {
        const { enabled, mode: m } = shuffle.getShuffle();
        console.log(enabled ? m : "off");
      } catch (e) {
        exitWithError(e);
      }
      return;
    }
    const m = mode.toLowerCase() as shuffle.ShuffleMode;
    if (m !== "off" && m !== "songs" && m !== "albums") {
      exitWithError(new Error("Shuffle must be: off, songs, or albums."));
    }
    try {
      shuffle.setShuffle(m);
      successLine(`Shuffle ${m}`, "⇄");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("repeat")
  .description("Get or set repeat (off | one | all)")
  .argument("[mode]", "off, one, or all")
  .action((mode: string | undefined) => {
    if (mode === undefined) {
      try {
        console.log(repeat.getRepeat());
      } catch (e) {
        exitWithError(e);
      }
      return;
    }
    const m = mode.toLowerCase() as repeat.RepeatMode;
    if (m !== "off" && m !== "one" && m !== "all") {
      exitWithError(new Error("Repeat must be: off, one, or all."));
    }
    try {
      repeat.setRepeat(m);
      successLine(`Repeat ${m}`, "↻");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("output")
  .description("List AirPlay devices or set output device")
  .argument("[device]", "device name to switch to (omit to list)")
  .action((device: string | undefined) => {
    if (device === undefined || device === "") {
      const devices = output.listOutputDevices();
      const current = output.getSelectedDevice();
      if (devices.length === 0) {
        emptyState("No AirPlay devices found.", "Make sure your speaker or Apple TV is on and on the same network.");
        return;
      }
      devices.forEach((d) => {
        const line = current === d ? c.success(d + " (current)") : d;
        console.log("  " + line);
      });
      return;
    }
    try {
      output.setOutputDevice(device);
      successLine(`Output: ${device}`, "◉");
    } catch (e) {
      exitWithError(e);
    }
  });

program
  .command("artwork-check")
  .description("Diagnose why ASCII artwork may not show (track type, media-control)")
  .action(() => {
    const trackClass = getCurrentTrackClass();
    const mc = getMediaControlStatus();
    const applescriptPath = saveArtworkToTempFile();
    const mrPath = getArtworkViaMediaControl();
    console.log("");
    console.log(c.title("  artwork check"));
    console.log(c.muted("  " + "─".repeat(36)));
    console.log("  Track type:  " + (trackClass ?? "(none / not playing)"));
    console.log("  media-control: " + (mc.found ? c.success("found at " + (mc.path ?? "PATH")) : c.dim("not found")));
    if (!mc.found) {
      console.log("  " + c.dim("Install with: brew install media-control"));
    }
    console.log("  AppleScript: " + (applescriptPath ? c.success("got art") : (trackClass?.toLowerCase().includes("url") ? c.dim("skipped (URL/streaming track)") : c.dim("no art"))));
    console.log("  media-control art: " + (mrPath ? c.success("got art") : c.dim("no art")));
    console.log("  → ASCII art will " + (applescriptPath || mrPath ? c.success("show") : c.dim("not show")) + " for /np");
    console.log("");
  });

const argv = process.argv.slice(2);
const wantsRepl = argv.length === 0 || argv[0] === "-i" || argv[0] === "--interactive";
if (wantsRepl) {
  if (argv[0] === "-i" || argv[0] === "--interactive") argv.shift();
  runRepl(program);
} else {
  try {
    program.parse();
  } catch (e) {
    exitWithError(e);
  }
}
