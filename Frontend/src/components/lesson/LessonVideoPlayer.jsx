import { useCallback, useEffect, useRef, useState } from "react";
import { Gauge, Maximize2, Minimize2, Pause, PictureInPicture2, Play, Volume2, VolumeX } from "lucide-react";
import studentApi from "../../services/studentApi";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SAVE_INTERVAL_MS = 5000;
const COMPLETION_THRESHOLD = 0.8;

const fmt = (s) => {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

const LessonVideoPlayer = ({ lesson, courseId, onComplete }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedPosRef = useRef(0);
  const completedFiredRef = useRef(false);
  const progressLoadedRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [seekDragging, setSeekDragging] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const [srcLoading, setSrcLoading] = useState(false);
  const [srcError, setSrcError] = useState(false);

  // Reset state when lesson changes
  useEffect(() => {
    completedFiredRef.current = false;
    progressLoadedRef.current = false;
    lastSavedPosRef.current = 0;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setMetaLoaded(false);
    setBuffering(false);
    setShowControls(true);
    setVideoSrc("");
    setSrcLoading(false);
    setSrcError(false);
  }, [lesson?._id]);

  // Fetch signed S3 playback URL
  useEffect(() => {
    if (!lesson?._id || lesson?.type !== "video") {
      if (lesson?.videoUrl) setVideoSrc(lesson.videoUrl);
      return;
    }
    if (!lesson.videoUrl && !lesson.videoKey) return;
    setSrcLoading(true);
    setSrcError(false);
    studentApi.getVideoSignedUrl(lesson._id)
      .then(({ data }) => setVideoSrc(data.videoUrl))
      .catch(() => setSrcError(true))
      .finally(() => setSrcLoading(false));
  }, [lesson?._id]);

  // Load saved progress and seek to resume position after metadata loads
  useEffect(() => {
    if (!lesson?._id || !courseId || progressLoadedRef.current) return;
    progressLoadedRef.current = true;

    studentApi.getLessonProgress(courseId, lesson._id)
      .then(({ data }) => {
        const prog = data.progress;
        if (prog?.completed) completedFiredRef.current = true;
        if (prog?.lastPosition > 2 && videoRef.current) {
          const trySeek = () => {
            const v = videoRef.current;
            if (!v) return;
            if (v.readyState >= 1) {
              v.currentTime = prog.lastPosition;
            } else {
              v.addEventListener("loadedmetadata", () => { v.currentTime = prog.lastPosition; }, { once: true });
            }
          };
          trySeek();
        }
      })
      .catch(() => {});
  }, [lesson?._id, courseId]);

  const saveProgress = useCallback((force = false) => {
    const v = videoRef.current;
    if (!v || !lesson?._id || !courseId) return;
    if (!isFinite(v.duration) || v.duration === 0) return;

    const pos = Math.floor(v.currentTime);
    if (!force && Math.abs(pos - lastSavedPosRef.current) < 2) return;
    lastSavedPosRef.current = pos;

    const dur = Math.floor(v.duration);
    const isComplete = pos / dur >= COMPLETION_THRESHOLD;

    studentApi.saveLessonProgress(courseId, lesson._id, {
      lastPosition: pos,
      watchedDuration: pos,
      duration: dur,
      completed: isComplete,
    }).catch(() => {});

    if (isComplete && !completedFiredRef.current) {
      completedFiredRef.current = true;
      onComplete?.(lesson._id);
    }
  }, [lesson?._id, courseId, onComplete]);

  // Periodic save
  useEffect(() => {
    saveTimerRef.current = setInterval(() => saveProgress(), SAVE_INTERVAL_MS);
    return () => {
      clearInterval(saveTimerRef.current);
      saveProgress(true);
    };
  }, [saveProgress]);

  // Auto-hide controls
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (!videoRef.current?.paused) setShowControls(false);
    }, 3000);
  }, []);

  useEffect(() => () => clearTimeout(controlsTimerRef.current), []);

  // Fullscreen listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const v = videoRef.current;
      if (!v || !containerRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowLeft") { e.preventDefault(); v.currentTime = Math.max(0, v.currentTime - 10); }
      if (e.code === "ArrowRight") { e.preventDefault(); v.currentTime = Math.min(v.duration, v.currentTime + 10); }
      if (e.code === "ArrowUp") { e.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); setVolume(v.volume); }
      if (e.code === "ArrowDown") { e.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); setVolume(v.volume); }
      if (e.code === "KeyF") { e.preventDefault(); toggleFullscreen(); }
      if (e.code === "KeyM") { e.preventDefault(); toggleMute(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
      setShowControls(true);
      clearTimeout(controlsTimerRef.current);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const handleSeekClick = (e) => {
    const v = videoRef.current;
    if (!v || !isFinite(v.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
    setCurrentTime(v.currentTime);
  };

  const setPlaybackSpeed = (s) => {
    if (videoRef.current) videoRef.current.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
    else document.exitFullscreen();
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else if (videoRef.current) await videoRef.current.requestPictureInPicture();
    } catch (_) {}
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="relative w-full overflow-hidden rounded-2xl bg-black select-none outline-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => { if (playing && !seekDragging) setShowControls(false); }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={videoSrc || undefined}
        className="h-full w-full object-contain"
        preload="metadata"
        playsInline
        onLoadedMetadata={(e) => {
          setDuration(e.target.duration);
          setMetaLoaded(true);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
        onProgress={(e) => {
          const buf = e.target.buffered;
          if (buf.length > 0) setBuffered(buf.end(buf.length - 1));
        }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onPlaying={() => { setBuffering(false); setPlaying(true); }}
        onPause={() => { setPlaying(false); setShowControls(true); }}
        onEnded={() => { setPlaying(false); saveProgress(true); setShowControls(true); }}
        onVolumeChange={(e) => { setMuted(e.target.muted); setVolume(e.target.volume); }}
      />

      {/* Loading overlay — shown while fetching signed URL or waiting for video metadata */}
      {(srcLoading || (!metaLoaded && !!videoSrc)) && !srcError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="h-10 w-10 rounded-full border-4 border-white/20 border-t-sky-400 animate-spin" />
        </div>
      )}

      {/* Error overlay — signed URL fetch failed */}
      {srcError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2">
          <p className="text-white/60 text-sm">Video unavailable</p>
          <button
            onClick={() => {
              setSrcError(false);
              setSrcLoading(true);
              studentApi.getVideoSignedUrl(lesson._id)
                .then(({ data }) => setVideoSrc(data.videoUrl))
                .catch(() => setSrcError(true))
                .finally(() => setSrcLoading(false));
            }}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white/70 hover:bg-white/20 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Buffering spinner */}
      {buffering && metaLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-12 w-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        </div>
      )}

      {/* Controls overlay */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${showControls ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 40%, transparent 70%)" }}
      >
        {/* Big play/pause center hint on click */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className={`rounded-full bg-black/40 p-4 transition-opacity duration-150 ${showControls && !playing ? "opacity-100" : "opacity-0"}`}>
            {playing ? <Pause size={36} className="text-white" /> : <Play size={36} className="text-white" />}
          </div>
        </div>

        {/* Progress bar */}
        <div
          className="pointer-events-auto px-4 pb-1 pt-2"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="group relative h-1.5 cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
            onClick={handleSeekClick}
            onMouseDown={() => setSeekDragging(true)}
            onMouseUp={() => setSeekDragging(false)}
          >
            <div className="absolute h-full rounded-full bg-white/25 transition-none" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute h-full rounded-full bg-sky-400" style={{ width: `${progressPct}%` }} />
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Controls row */}
        <div
          className="pointer-events-auto flex items-center gap-2 px-4 pb-3 pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white/90 hover:text-white transition" title={playing ? "Pause (Space)" : "Play (Space)"}>
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Volume */}
          <button onClick={toggleMute} className="ml-1 text-white/70 hover:text-white transition" title="Toggle mute (M)">
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05}
            value={muted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-16 cursor-pointer accent-sky-400"
            style={{ accentColor: "#38bdf8" }}
          />

          {/* Time */}
          <span className="ml-1 shrink-0 text-xs tabular-nums text-white/60">
            {fmt(currentTime)} / {fmt(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback speed */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu((s) => !s)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white transition"
              title="Playback speed"
            >
              <Gauge size={14} /> {speed}x
            </button>
            {showSpeedMenu && (
              <div
                className="absolute bottom-full right-0 mb-2 w-24 rounded-xl border border-white/10 bg-black/95 p-1 shadow-2xl backdrop-blur"
                onClick={(e) => e.stopPropagation()}
              >
                {SPEEDS.map((s) => (
                  <button key={s} onClick={() => setPlaybackSpeed(s)}
                    className={`block w-full rounded-lg px-3 py-1.5 text-left text-xs transition hover:bg-white/10 ${s === speed ? "font-bold text-sky-400" : "text-white/70"}`}>
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* PiP */}
          <button onClick={togglePiP} className="text-white/70 hover:text-white transition" title="Picture in Picture">
            <PictureInPicture2 size={16} />
          </button>

          {/* Fullscreen */}
          <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition" title="Fullscreen (F)">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonVideoPlayer;
