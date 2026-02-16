/**
 * Library: list songs, albums, artists, playlists, genres; play by target.
 * Uses temp playlist for "play album/artist/playlist/genre" (no native play album in AppleScript).
 */

import { run, escapeForAppleScript } from "./osascript.js";

export type ListType = "songs" | "albums" | "artists" | "playlists" | "genres";

const TEMP_PLAYLIST_NAME = "am-cli-temp-playlist";

function parseListOutput(raw: string): string[] {
  if (!raw.trim()) return [];
  // AppleScript returns "item1, item2" or one per line; handle both
  const byLine = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (byLine.length > 1) return byLine;
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

function listPlaylists(): string[] {
  const out = run(`
    tell application "APPLICATION"
      set names to name of every playlist
      set text item delimiters to "\\n"
      return names as text
    end tell
  `);
  return parseListOutput(out);
}

function listAlbums(): string[] {
  try {
    const out = run(`
      tell application "APPLICATION"
        set src to source 1
        set names to name of every album of src
        set text item delimiters to "\\n"
        return names as text
      end tell
    `);
    return parseListOutput(out);
  } catch {
    return [];
  }
}

function listArtists(): string[] {
  try {
    const out = run(`
      tell application "APPLICATION"
        set src to source 1
        set artistList to {}
        repeat with a in (get every album of src)
          set art to artist of a
          if art is not "" and art is not in artistList then
            set end of artistList to art
          end if
        end repeat
        set text item delimiters to "\\n"
        return artistList as text
      end tell
    `);
    return parseListOutput(out);
  } catch {
    return [];
  }
}

function listGenres(): string[] {
  try {
    const out = run(`
      tell application "APPLICATION"
        set src to source 1
        set genreList to {}
        repeat with g in (get every genre of src)
          set gname to name of g
          if gname is not "" and genreList does not contain gname then
            set end of genreList to gname
          end if
        end repeat
        set text item delimiters to "\\n"
        return genreList as text
      end tell
    `);
    return parseListOutput(out);
  } catch {
    return [];
  }
}

/** List songs in library (can be slow). Optionally filter by name. */
function listSongs(filter?: string): string[] {
  try {
    const filterClause = filter
      ? ` and (name contains "${escapeForAppleScript(filter)}" or artist contains "${escapeForAppleScript(filter)}")`
      : "";
    const out = run(`
      tell application "APPLICATION"
        set src to source 1
        set trackList to (every track of src whose kind is song ${filterClause})
        set names to name of trackList
        set text item delimiters to "\\n"
        return names as text
      end tell
    `);
    return parseListOutput(out);
  } catch {
    return [];
  }
}

export function list(type: ListType, filter?: string): string[] {
  switch (type) {
    case "playlists":
      return listPlaylists().filter((n) => !filter || n.toLowerCase().includes(filter.toLowerCase()));
    case "albums":
      return listAlbums().filter((n) => !filter || n.toLowerCase().includes(filter.toLowerCase()));
    case "artists":
      return listArtists().filter((n) => !filter || n.toLowerCase().includes(filter.toLowerCase()));
    case "genres":
      return listGenres().filter((n) => !filter || n.toLowerCase().includes(filter.toLowerCase()));
    case "songs":
      return listSongs(filter);
    default:
      return [];
  }
}

/** Delete temp playlist if it exists. */
export function deleteTempPlaylist(): void {
  try {
    run(`
      tell application "APPLICATION"
        if (exists playlist "${escapeForAppleScript(TEMP_PLAYLIST_NAME)}") then
          delete playlist "${escapeForAppleScript(TEMP_PLAYLIST_NAME)}"
        end if
      end tell
    `);
  } catch {
    // ignore
  }
}

export type PlayTarget = "song" | "album" | "artist" | "playlist" | "genre";

/** Play by album: create temp playlist with all tracks from that album, then play. */
export function playAlbum(albumName: string): void {
  try {
    deleteTempPlaylist();
    const name = escapeForAppleScript(albumName);
    run(`
    tell application "APPLICATION"
      set src to source 1
      set alb to first album of src whose name contains "${name}" or name is "${name}"
      set trackList to every track of alb
      set newPl to make new playlist with properties {name: "${escapeForAppleScript(TEMP_PLAYLIST_NAME)}"}
      duplicate trackList to newPl
      play first track of newPl
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No album found matching "${albumName}". Check the name and try again.`);
  }
}

/** Play by artist: temp playlist with all tracks from that artist. */
export function playArtist(artistName: string): void {
  try {
    deleteTempPlaylist();
    const name = escapeForAppleScript(artistName);
    run(`
    tell application "APPLICATION"
      set src to source 1
      set trackList to (every track of src whose artist contains "${name}" or artist is "${name}")
      set newPl to make new playlist with properties {name: "${escapeForAppleScript(TEMP_PLAYLIST_NAME)}"}
      duplicate trackList to newPl
      play first track of newPl
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No artist found matching "${artistName}". Check the name and try again.`);
  }
}

/** Play a playlist by name. */
export function playPlaylist(playlistName: string): void {
  try {
    run(`
    tell application "APPLICATION"
      set pl to first playlist whose name contains "${escapeForAppleScript(playlistName)}" or name is "${escapeForAppleScript(playlistName)}"
      play first track of pl
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No playlist found matching "${playlistName}". Check the name and try again.`);
  }
}

/** Play by genre: temp playlist with all tracks in that genre. */
export function playGenre(genreName: string): void {
  try {
    deleteTempPlaylist();
    const name = escapeForAppleScript(genreName);
    run(`
    tell application "APPLICATION"
      set src to source 1
      set trackList to (every track of src whose genre contains "${name}" or genre is "${name}")
      set newPl to make new playlist with properties {name: "${escapeForAppleScript(TEMP_PLAYLIST_NAME)}"}
      duplicate trackList to newPl
      play first track of newPl
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No genre found matching "${genreName}". Check the name and try again.`);
  }
}

/** Play a single song by name (first match). */
export function playSong(songName: string): void {
  try {
    const name = escapeForAppleScript(songName);
    run(
      'tell application "APPLICATION" to play (first track of source 1 whose name contains "' +
        name +
        '" or name is "' +
        name +
        '")'
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error(`No song found matching "${songName}". Check the name and try again.`);
  }
}

/** Play a random song from the library. */
export function playRandomSong(): void {
  try {
    run(`
    tell application "APPLICATION"
      set src to source 1
      set songList to (every track of src whose kind is song)
      set n to count of songList
      if n is 0 then return
      set r to (random number from 1 to n)
      play item r of songList
    end tell
  `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("not running")) throw e;
    throw new Error("Your library has no songs, or Music.app couldn't pick one. Add music to your library and try again.");
  }
}

/**
 * Add the current track to your library (duplicate to source "Library").
 * Works when the current track is from a playlist; may not work for some sources (e.g. Create Station).
 */
export function addCurrentTrackToLibrary(): void {
  try {
    run(`
      tell application "APPLICATION"
        set currentTrack to current track
        duplicate currentTrack to source "Library"
      end tell
    `);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("not running")) throw e;
    if (msg.includes("-1700") || msg.toLowerCase().includes("expected type") || msg.toLowerCase().includes("can't make")) {
      throw new Error("This track can't be added to your library from this source (e.g. radio/station). Try playing from a playlist first.");
    }
    if (msg.toLowerCase().includes("can't get current track") || (msg.toLowerCase().includes("can't get") && msg.toLowerCase().includes("current track"))) {
      throw new Error("No track is playing. Play something first, then run /add again.");
    }
    throw new Error("Couldn't add this track to your library. Some tracks (e.g. from Apple Music streaming) can't be added from the CLI.");
  }
}