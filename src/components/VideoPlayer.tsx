import { useState } from "react";
import { AlertTriangle, RefreshCw, SkipBack, SkipForward, ChevronLeft, ChevronRight, Server } from "lucide-react";
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

  const currentUrl = server === "backup" ? backupUrl : primaryUrl;

  if (error) {
    return (
      <div className="w-full aspect-video rounded-xl bg-secondary flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="text-destructive" size={40} />
        <p className="text-muted-foreground text-sm">Stream unavailable</p>
        <button
          onClick={() => {
            setError(false);
            setServer("primary");
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium active:scale-[0.97]"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden bg-secondary relative">
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
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/80 border-t border-border">
        <div className="flex items-center gap-1">
          {/* Prev episode */}
          <button
            onClick={onPrevEp}
            disabled={!hasPrev}
            className="p-2 rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition-colors active:scale-[0.95]"
            title="Previous episode"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Skip backward */}
          <button
            onClick={() => {
              // Can't directly control iframe, but useful for native players
            }}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors active:scale-[0.95] flex items-center gap-0.5 text-xs"
            title={`Skip back ${settings.skipDuration}s`}
          >
            <SkipBack size={14} />
            <span className="text-[10px] text-muted-foreground">{settings.skipDuration}s</span>
          </button>

          {episode && (
            <span className="text-xs text-muted-foreground px-2">EP {episode}</span>
          )}

          {/* Skip forward */}
          <button
            onClick={() => {}}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors active:scale-[0.95] flex items-center gap-0.5 text-xs"
            title={`Skip forward ${settings.skipDuration}s`}
          >
            <span className="text-[10px] text-muted-foreground">{settings.skipDuration}s</span>
            <SkipForward size={14} />
          </button>

          {/* Next episode */}
          <button
            onClick={onNextEp}
            disabled={!hasNext}
            className="p-2 rounded-lg text-foreground hover:bg-muted disabled:opacity-30 transition-colors active:scale-[0.95]"
            title="Next episode"
          >
            <ChevronRight size={16} />
          </button>
        </div>

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
  );
};

export default VideoPlayer;
