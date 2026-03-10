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
      <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#131d30] rounded-xl px-4 py-3 border border-slate-200 dark:border-[#243350]">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 dark:bg-slate-600 text-white hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors flex-shrink-0 shadow-sm"
          aria-label={playing ? "Pause radio" : "Play radio"}
        >
          {playing ? (
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Station info + nav */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <button
            onClick={() => setStationIdx((i) => (i - 1 + STATIONS.length) % STATIONS.length)}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex-shrink-0 p-1"
            aria-label="Previous station"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </button>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate block">
              {station.name}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              SomaFM
            </span>
          </div>
          <button
            onClick={nextStation}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex-shrink-0 p-1"
            aria-label="Next station"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>
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
          className="w-16 h-1 accent-slate-600 dark:accent-slate-400 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Volume"
        />
      </div>
    </div>
  );
}
