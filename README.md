# Apple Music CLI

A local-only command-line interface for **Music.app** on macOS. Control playback, see now playing with optional ASCII artwork, manage volume and shuffle/repeat, play by song/album/artist/playlist/genre, and switch AirPlay output — all via AppleScript. No Apple Developer account or API keys required.

## Requirements

- **macOS** (Music.app is macOS-only)
- **Node.js** 18+
- **Music.app** (formerly iTunes) with your library

## Install

**From npm (after publishing):**

```bash
npm install -g applemusic-cli
```

**Run without installing:**

```bash
npx applemusic-cli
```

**From source (clone this repo):**

```bash
git clone https://github.com/thearvindas/applemusic-cli.git
cd applemusic-cli
npm install
npm run build
npm link
```

Then run `applemusic-cli` from anywhere.

## Usage

### One-shot commands

Run a single command and exit:

```bash
applemusic-cli play                    # Start playback (random song)
applemusic-cli pause                   # Pause
applemusic-cli toggle                  # Toggle play/pause
applemusic-cli next                    # Next track
applemusic-cli prev                    # Previous track
applemusic-cli stop                    # Stop
applemusic-cli np                      # Now playing (track, artist, album, position)
applemusic-cli volume                  # Get volume (0–100)
applemusic-cli volume 50                # Set volume to 50
applemusic-cli shuffle                  # Get shuffle mode
applemusic-cli shuffle songs            # Set shuffle to songs
applemusic-cli repeat all               # Set repeat to all
applemusic-cli play album "In Rainbows"    # Play album by name
applemusic-cli play artist "Radiohead"     # Play artist
applemusic-cli play playlist "Favorites"   # Play playlist
applemusic-cli output                   # List AirPlay devices
applemusic-cli output "Living Room"     # Set output to that device
```

### Interactive mode (REPL)

Run with no arguments to enter an interactive session. Type commands directly (no slash required):

```bash
applemusic-cli
# or
applemusic-cli -i
applemusic-cli --interactive
```

- **Press Enter** (empty line) or type **`help`** — show all commands
- **`play`**, **`pause`**, **`np`**, **`volume 50`**, etc. — same as one-shot
- **`play album In Rainbows`** — play by target (album, artist, playlist, genre, song)
- **`exit`** or **`quit`** — leave the REPL

Tab completion works on the first word. A leading **`/`** is optional (e.g. `/play` works).

When output is a TTY you get progress bar, success feedback (e.g. `✓ Playing`), friendly empty states, and grouped help (Playback, Now playing, Output, Session). Colors and icons are disabled when stdout is not a TTY (e.g. piping) so output stays plain text.

## Commands summary

| Command | Description |
|--------|-------------|
| `play` | Start playback, or `play album \| artist \| playlist \| genre \| song <name>` |
| `pause`, `toggle`, `next`, `prev`, `stop` | Playback control |
| `np`, `status` | Now playing (track, artist, album; optional ASCII art) |
| `volume [0-100]` | Get or set volume |
| `shuffle [off \| songs \| albums]` | Shuffle mode |
| `repeat [off \| one \| all]` | Repeat mode |
| `output [device]` | List or set AirPlay output |
| `help` | Show all commands (REPL) |

## Now playing artwork (ASCII)

When you run `applemusic-cli np` or `/np`, the CLI can show album art as ASCII in the terminal. Artwork is fetched in two ways:

1. **AppleScript** — Works for **library** tracks (songs in your library). Streaming (URL) tracks do not expose artwork data via AppleScript.
2. **media-control** (optional) — Uses the same system source as the Now Playing widget (MediaRemote). If you install [media-control](https://github.com/ungive/media-control), artwork will also work for **streaming** tracks:

   ```bash
   brew install media-control
   ```

   No config needed; if `media-control` is on your PATH, the CLI will use it when AppleScript doesn't have art.

## Local only / no API

This CLI talks only to **Music.app** on your Mac via AppleScript. It does **not** use the Apple Music API. So:

- **No catalog search** — you can't search all of Apple Music; only your library.
- **Library only** — play only what's in your Music.app library (including Apple Music tracks you've added).

## Development

```bash
git clone https://github.com/thearvindas/applemusic-cli.git
cd applemusic-cli
npm install
npm run build
npm test
```

- **`npm run build`** — compile TypeScript to `dist/`
- **`npm test`** — smoke test all CLI commands (does not require Music.app to be playing)

## Before publishing to npm

Run `npm run build` and `npm test` to confirm everything works.

## Publishing to npm (optional)

1. Create an account at [npmjs.com](https://www.npmjs.com/signup) if you don't have one.
2. From the project root: `npm login`, then `npm publish`.
3. After that, anyone can install with `npm install -g applemusic-cli`.

## License

MIT
