"use client";

import { useState, useRef, useEffect } from "react";

const STATIONS = [
  { name: "Groove Salad", url: "https://ice1.somafm.com/groovesalad-256-mp3" },
  { name: "Suburbs of Goa", url: "https://ice1.somafm.com/suburbsofgoa-128-mp3" },
  { name: "Drone Zone", url: "https://ice1.somafm.com/dronezone-256-mp3" },
  { name: "Deep Space One", url: "https://ice1.somafm.com/deepspaceone-128-mp3" },
  { name: "Lush", url: "https://ice1.somafm.com/lush-128-mp3" },
];

export default function RadioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [stationIdx, setStationIdx] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const station = STATIONS[stationIdx];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.src = station.url;
      audio.load();
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, [playing, station.url]);

  const toggle = () => setPlaying((p) => !p);

  const nextStation = () => {
    setStationIdx((i) => (i + 1) % STATIONS.length);
  };

  return (
    <div className="mx-4 mb-3">
      <audio ref={audioRef} />
      <div className="flex items-center gap-2.5 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-[#1a1333] dark:to-[#131d30] rounded-xl px-3.5 py-2.5 border border-purple-100/80 dark:border-[#2a2045]">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-500/15 dark:bg-purple-400/15 text-purple-600 dark:text-purple-300 hover:bg-purple-500/25 transition-colors flex-shrink-0"
          aria-label={playing ? "Pause radio" : "Play radio"}
        >
          {playing ? (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Station info + nav */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          <button
            onClick={() => setStationIdx((i) => (i - 1 + STATIONS.length) % STATIONS.length)}
            className="text-purple-400/60 hover:text-purple-300 transition-colors flex-shrink-0"
            aria-label="Previous station"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-purple-700 dark:text-purple-200 truncate block">
              {station.name}
            </span>
            <span className="text-[10px] text-purple-400/50 dark:text-purple-300/40">
              SomaFM
            </span>
          </div>
          <button
            onClick={nextStation}
            className="text-purple-400/60 hover:text-purple-300 transition-colors flex-shrink-0"
            aria-label="Next station"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
          </button>
        </div>

        {/* Volume */}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-16 h-1 accent-purple-500 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
