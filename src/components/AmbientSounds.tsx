"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ── Procedural ambient sound generators using Web Audio API ──
// No external files or streams needed — fully offline-capable.

type SoundType = "rain" | "whitenoise" | "brownnoise" | "cafe" | "lofi";

interface SoundOption {
  id: SoundType;
  label: string;
  emoji: string;
}

const SOUNDS: SoundOption[] = [
  { id: "rain", label: "Rain", emoji: "🌧️" },
  { id: "cafe", label: "Café", emoji: "☕" },
  { id: "whitenoise", label: "White Noise", emoji: "📻" },
  { id: "brownnoise", label: "Brown Noise", emoji: "🟤" },
];

// YouTube lo-fi livestream IDs (these are well-known 24/7 streams)
const YOUTUBE_STREAMS = [
  { id: "jfKfPfyJRdk", label: "lofi hip hop radio", channel: "Lofi Girl" },
  { id: "4xDzrJKXOOY", label: "synthwave radio", channel: "Lofi Girl" },
];

// Spotify playlists curated to match SomaFM station vibes (all verified working)
const SPOTIFY_PLAYLISTS = [
  // Groove Salad vibes — ambient/downtempo/chillout
  { uri: "37i9dQZF1DX3Ogo9pFvBkY", label: "Ambient Relaxation", desc: "Groove Salad vibes" },
  { uri: "37i9dQZF1DWZeKCadgRdKQ", label: "Deep Focus", desc: "Ambient focus" },
  { uri: "37i9dQZF1DX1n9whBbBKoL", label: "Floating Through Space", desc: "Deep space ambient" },
  { uri: "37i9dQZF1DX6VdMW310YC7", label: "Chill Tracks", desc: "Downtempo electronic" },
  // Suburbs of Goa vibes — Indian indie / lofi
  { uri: "37i9dQZF1DX5q67ZpWyRrZ", label: "Indie India", desc: "Suburbs of Goa vibes" },
  { uri: "37i9dQZF1DWYoYGBbGKurt", label: "Lofi Chill", desc: "Chill beats to study to" },
];

// SoundCloud playlists — full free playback, no login needed (all verified)
const SOUNDCLOUD_PLAYLISTS = [
  { url: "https://soundcloud.com/lofi_girl/sets/lofi-hiphop", label: "Lo-fi Hip Hop", desc: "Lofi Girl \u2022 217 tracks" },
  { url: "https://soundcloud.com/chillhopdotcom/sets/lofihiphop", label: "Chillhop Lo-fi", desc: "Chillhop Music \u2022 89 tracks" },
  { url: "https://soundcloud.com/lofi_girl/sets/synthwave-ambient-chill-music", label: "Synth Ambient", desc: "Lofi Girl \u2022 37 tracks" },
  { url: "https://soundcloud.com/globetrotting-music/sets/indian-lofi-diwali-holi-lofi", label: "Indian Lo-fi", desc: "Diwali & Holi vibes \u2022 43 tracks" },
  { url: "https://soundcloud.com/quest4goa/sets/chill-out-psy-ambient-music", label: "Psy Ambient / Goa", desc: "Quest4Goa \u2022 24 tracks" },
];

// SomaFM stations for external linking (embedding prohibited by TOS)
const SOMAFM_STATIONS = [
  { slug: "groovesalad", label: "Groove Salad", desc: "Ambient/downtempo" },
  { slug: "suburbsofgoa", label: "Suburbs of Goa", desc: "World/Indian electronica" },
];

function createRainSound(ctx: AudioContext, dest: AudioNode) {
  // Rain = filtered noise bursts with random modulation
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      // Rain-like texture: noise with amplitude modulation
      const envelope = 0.3 + 0.7 * Math.pow(Math.random(), 3);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass filter to shape rain frequencies
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  // Slight highpass for realism
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 200;

  source.connect(filter);
  filter.connect(hp);
  hp.connect(dest);
  source.start();
  return source;
}

function createWhiteNoise(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(dest);
  source.start();
  return source;
}

function createBrownNoise(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5; // Boost amplitude
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(dest);
  source.start();
  return source;
}

function createCafeSound(ctx: AudioContext, dest: AudioNode) {
  // Café = brown noise + occasional "chatter" bursts (filtered noise)
  const bufferSize = ctx.sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let brown = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      brown = (brown + 0.02 * white) / 1.02;
      // Random amplitude swells for "murmur" effect
      const t = i / ctx.sampleRate;
      const murmur = 0.6 + 0.4 * Math.sin(t * 0.3 + Math.random() * 0.1);
      data[i] = brown * 2.5 * murmur;
    }
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass to simulate muffled voices
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 500;
  filter.Q.value = 0.3;

  source.connect(filter);
  filter.connect(dest);
  source.start();
  return source;
}

function startSound(
  ctx: AudioContext,
  type: SoundType,
  gain: GainNode
): AudioBufferSourceNode {
  switch (type) {
    case "rain":
      return createRainSound(ctx, gain);
    case "whitenoise":
      return createWhiteNoise(ctx, gain);
    case "brownnoise":
      return createBrownNoise(ctx, gain);
    case "cafe":
      return createCafeSound(ctx, gain);
    default:
      return createWhiteNoise(ctx, gain);
  }
}

export default function AmbientSounds() {
  const [mode, setMode] = useState<"sounds" | "spotify" | "soundcloud" | "lofi">("soundcloud");
  const [activeSound, setActiveSound] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [ytStreamIdx, setYtStreamIdx] = useState(0);
  const [showYt, setShowYt] = useState(false);
  const [spotifyIdx, setSpotifyIdx] = useState(0);
  const [scIdx, setScIdx] = useState(3);
  const [scShuffle, setScShuffle] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // Remember that the user has seen the music section
  useEffect(() => {
    if (!collapsed) {
      try { localStorage.setItem("foci_music_seen", "true"); } catch {}
    }
  }, [collapsed]);

  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const scIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Send a command to the SoundCloud Widget via postMessage
  const scCommand = useCallback((method: string, value?: unknown) => {
    const iframe = scIframeRef.current;
    if (!iframe?.contentWindow) return;
    const msg: Record<string, unknown> = { method };
    if (value !== undefined) msg.value = value;
    iframe.contentWindow.postMessage(
      JSON.stringify(msg),
      "https://w.soundcloud.com"
    );
  }, []);

  const stopSound = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      // If tapping the same sound → toggle off
      if (activeSound === type) {
        stopSound();
        setActiveSound(null);
        return;
      }

      stopSound();

      if (!ctxRef.current) {
        ctxRef.current = new AudioContext();
        const g = ctxRef.current.createGain();
        g.gain.value = volume;
        g.connect(ctxRef.current.destination);
        gainRef.current = g;
      }

      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume();
      }

      if (gainRef.current) {
        gainRef.current.gain.value = volume;
      }

      sourceRef.current = startSound(ctxRef.current, type, gainRef.current!);
      setActiveSound(type);
    },
    [activeSound, volume, stopSound]
  );

  // Update gain when volume changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sourceRef.current?.stop();
      ctxRef.current?.close();
    };
  }, []);

  const ytStream = YOUTUBE_STREAMS[ytStreamIdx];
  const spotifyPlaylist = SPOTIFY_PLAYLISTS[spotifyIdx];
  const scPlaylist = SOUNDCLOUD_PLAYLISTS[scIdx];

  return (
    <div className="mx-4 mb-3 space-y-2">
      {/* Collapse toggle header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] hover:bg-slate-200/60 dark:hover:bg-[#1a2d4a] transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">🎵 Music & Sounds</span>
        <svg
          className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={collapsed ? 'hidden' : ''}>
      {/* Mode toggle */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#131d30] rounded-lg p-0.5 border border-slate-200 dark:border-[#243350]">
        <button
          onClick={() => { setMode("sounds"); setShowYt(false); }}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "sounds"
              ? "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          🎧 Sounds
        </button>
        <button
          onClick={() => setMode("spotify")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "spotify"
              ? "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          <svg className="inline-block w-3.5 h-3.5 mr-0.5 -mt-px" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
          Spotify
        </button>
        <button
          onClick={() => setMode("soundcloud")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "soundcloud"
              ? "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          ☁️ SoundCloud
        </button>
        <button
          onClick={() => setMode("lofi")}
          className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
            mode === "lofi"
              ? "bg-white dark:bg-[#1a2d4a] text-slate-800 dark:text-slate-100 shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          }`}
        >
          📺 Lo-fi
        </button>
      </div>

      {/* Ambient Sounds mode */}
      {mode === "sounds" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl px-3 py-3 border border-slate-200 dark:border-[#243350]">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
            {SOUNDS.map((s) => (
              <button
                key={s.id}
                onClick={() => playSound(s.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-xs font-medium transition-all ${
                  activeSound === s.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-300 dark:ring-blue-700"
                    : "bg-white dark:bg-[#1a2d4a] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#243350]"
                }`}
                aria-label={`${activeSound === s.id ? "Stop" : "Play"} ${s.label}`}
              >
                <span className="text-lg">{s.emoji}</span>
                <span className="truncate w-full text-center">{s.label}</span>
              </button>
            ))}
          </div>
          {/* Volume control — only show when a sound is active */}
          {activeSound && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-200 dark:border-[#243350]">
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-blue-500 dark:accent-blue-400"
                aria-label="Volume"
              />
              <span className="text-xs text-slate-400 dark:text-slate-500 w-7 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Lo-fi Radio mode (YouTube embed) */}
      {mode === "lofi" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          {showYt ? (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${ytStream.id}?autoplay=1&mute=0`}
                title={ytStream.label}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                Stream lo-fi music from YouTube
              </p>
              <button
                onClick={() => setShowYt(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0C.488 3.45.029 5.804 0 12c.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0C23.512 20.55 23.971 18.196 24 12c-.029-6.185-.484-8.549-4.385-8.816zM9 16V8l8 4-8 4z" />
                </svg>
                Play {ytStream.label}
              </button>
            </div>
          )}
          {/* Stream selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => {
                setYtStreamIdx((i) => (i - 1 + YOUTUBE_STREAMS.length) % YOUTUBE_STREAMS.length);
                setShowYt(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous stream"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {ytStream.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {ytStream.channel}
              </span>
            </div>
            <button
              onClick={() => {
                setYtStreamIdx((i) => (i + 1) % YOUTUBE_STREAMS.length);
                setShowYt(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next stream"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Spotify mode */}
      {mode === "spotify" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          <iframe
            src={`https://open.spotify.com/embed/playlist/${spotifyPlaylist.uri}?utm_source=generator&theme=0`}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="border-0"
            title={spotifyPlaylist.label}
          />
          {/* Playlist selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => setSpotifyIdx((i) => (i - 1 + SPOTIFY_PLAYLISTS.length) % SPOTIFY_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {spotifyPlaylist.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {spotifyPlaylist.desc}
              </span>
            </div>
            <button
              onClick={() => setSpotifyIdx((i) => (i + 1) % SPOTIFY_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center pb-2 px-3">
            Log in to Spotify for full tracks
          </p>
        </div>
      )}

      {/* SoundCloud mode */}
      {mode === "soundcloud" && (
        <div className="bg-slate-100 dark:bg-[#131d30] rounded-xl border border-slate-200 dark:border-[#243350] overflow-hidden">
          <iframe
            ref={scIframeRef}
            width="100%"
            height="166"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(scPlaylist.url)}&color=%23334155&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false`}
            title={scPlaylist.label}
            className="border-0"
          />
          {/* Track skip controls */}
          <div className="flex items-center justify-center gap-3 px-3 py-1.5 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => scCommand("prev")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous track"
              title="Previous track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button
              onClick={() => scCommand("toggle")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Play / Pause"
              title="Play / Pause"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <button
              onClick={() => scCommand("next")}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next track"
              title="Next track"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <button
              onClick={() => {
                const next = !scShuffle;
                setScShuffle(next);
                scCommand("setShuffle", next);
              }}
              className={`p-1 transition-colors ${
                scShuffle
                  ? "text-blue-500 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
              aria-label="Shuffle"
              title={scShuffle ? "Shuffle on" : "Shuffle off"}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/></svg>
            </button>
          </div>
          {/* Playlist selector */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-[#243350]">
            <button
              onClick={() => setScIdx((i) => (i - 1 + SOUNDCLOUD_PLAYLISTS.length) % SOUNDCLOUD_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Previous playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
            <div className="text-center min-w-0">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
                {scPlaylist.label}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {scPlaylist.desc}
              </span>
            </div>
            <button
              onClick={() => setScIdx((i) => (i + 1) % SOUNDCLOUD_PLAYLISTS.length)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors p-1"
              aria-label="Next playlist"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* SomaFM external links */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-medium text-slate-400 dark:text-slate-500">SomaFM:</span>
        {SOMAFM_STATIONS.map((s) => (
          <a
            key={s.slug}
            href={`https://somafm.com/player/#/now-playing/${s.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-slate-100 dark:bg-[#131d30] border border-slate-200 dark:border-[#243350] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-[#3a5070] transition-colors"
            title={s.desc}
          >
            <svg className="w-2.5 h-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            {s.label}
          </a>
        ))}
      </div>
      </div>
    </div>
  );
}
