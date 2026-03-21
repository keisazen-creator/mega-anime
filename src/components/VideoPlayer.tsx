import { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface VideoPlayerProps {
  primaryUrl: string;
  backupUrl: string;
}

const VideoPlayer = ({ primaryUrl, backupUrl }: VideoPlayerProps) => {
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState(false);

  const currentUrl = useBackup ? backupUrl : primaryUrl;

  const handleError = () => {
    if (!useBackup) {
      setUseBackup(true);
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className="w-full aspect-video rounded-xl bg-secondary flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="text-destructive" size={40} />
        <p className="text-muted-foreground text-sm">Stream unavailable</p>
        <button
          onClick={() => {
            setError(false);
            setUseBackup(false);
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
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-secondary relative">
      <iframe
        key={currentUrl}
        src={currentUrl}
        className="w-full h-full border-0"
        allowFullScreen
        allow="autoplay; fullscreen; encrypted-media"
        onError={handleError}
        title="Video Player"
      />
      {useBackup && (
        <div className="absolute top-3 right-3 px-2 py-1 rounded bg-secondary/80 text-xs text-muted-foreground">
          Backup source
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
