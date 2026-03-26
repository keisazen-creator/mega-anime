import { useState, useEffect, useRef } from "react";
import { AlertTriangle, RefreshCw, SkipBack, SkipForward, ChevronLeft, ChevronRight, Server, Maximize2, Monitor } from "lucide-react";
import { getSettings } from "@/lib/settings";

interface VideoPlayerProps {
  primaryUrl: string;
  backupUrl: string;
  onPrevEp?: () => void;
  onNextEp?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  episode?: number;
}

const VideoPlayer = ({ primaryUrl, backupUrl, onPrevEp, onNextEp, hasPrev, hasNext, episode }: VideoPlayerProps) => {
  const settings = getSettings();
  const [server, setServer] = useState<"primary" | "backup">(settings.preferredServer);
  const [error, setError] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const currentUrl = server === "backup" ? backupUrl : primaryUrl;

  // Auto-hide controls in immersive mode
  useEffect(() => {
    if (!immersive) {
      setControlsVisible(true);
      return;
    }
    const resetTimer = () => {
      setControlsVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
    };
    resetTimer();
    const el = containerRef.current;
    if (el) {
      el.addEventListener("mousemove", resetTimer);
      el.addEventListener("touchstart", resetTimer);
      return () => {
        el.removeEventListener("mousemove", resetTimer);
        el.removeEventListener("touchstart", resetTimer);
        if (hideTimer.current) clearTimeout(hideTimer.current);
      };
    }
  }, [immersive]);

  if (error) {
    return (
      <div className="w-full aspect-video rounded-xl bg-secondary flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="text-destructive" size={40} />
        <p className="text-muted-foreground text-sm">Stream unavailable</p>
        <button
          onClick={() => { setError(false); setServer("primary"); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97]"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full rounded-xl overflow-hidden bg-secondary relative transition-all duration-500 ${
        immersive ? "ring-2 ring-primary/30 shadow-2xl shadow-primary/10" : ""
      }`}
    >
      {/* Ambient glow effect in immersive mode */}
      {immersive && (
        <div className="absolute -inset-4 rounded-2xl bg-primary/5 blur-2xl pointer-events-none -z-10" />
      )}

      {/* Player */}
      <div className="aspect-video relative">
        <iframe
          key={currentUrl}
          src={currentUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media"
          onError={() => setError(true)}
          title="Video Player"
        />
      </div>

      {/* Controls bar */}
      <div
        className={`flex items-center justify-between px-3 py-2 bg-secondary/80 border-t border-border transition-all duration-300 ${
          immersive && !controlsVisible ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={onPrevEp}
            disabled={!hasPrev}
            className="p-2 rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition-colors active:scale-[0.95]"
            title="Previous episode"
          >
            <ChevronLeft size={16} />
          </button>

          <button
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors active:scale-[0.95] flex items-center gap-0.5 text-xs"
            title={`Skip back ${settings.skipDuration}s`}
          >
            <SkipBack size={14} />
            <span className="text-[10px] text-muted-foreground">{settings.skipDuration}s</span>
          </button>

          {episode && (
            <span className="text-xs text-muted-foreground px-2 font-medium">EP {episode}</span>
          )}

          <button
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors active:scale-[0.95] flex items-center gap-0.5 text-xs"
            title={`Skip forward ${settings.skipDuration}s`}
          >
            <span className="text-[10px] text-muted-foreground">{settings.skipDuration}s</span>
            <SkipForward size={14} />
          </button>

          <button
            onClick={onNextEp}
            disabled={!hasNext}
            className="p-2 rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition-colors active:scale-[0.95]"
            title="Next episode"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Immersive mode toggle */}
          <button
            onClick={() => setImmersive(!immersive)}
            className={`p-2 rounded-lg transition-colors active:scale-[0.95] ${
              immersive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title={immersive ? "Exit immersive" : "Scene Immersion"}
          >
            <Monitor size={14} />
          </button>

          {/* Server switch */}
          <div className="flex items-center gap-1">
            <Server size={12} className="text-muted-foreground" />
            <select
              value={server}
              onChange={(e) => setServer(e.target.value as "primary" | "backup")}
              className="bg-transparent text-xs text-muted-foreground border-none focus:outline-none cursor-pointer"
            >
              <option value="primary">VidFast</option>
              <option value="backup">VidSrc</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
