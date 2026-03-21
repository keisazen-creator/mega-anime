import { useState } from "react";
import Navbar from "@/components/Navbar";
import { getSettings, saveSettings, type UserSettings } from "@/lib/settings";
import { Settings, SkipForward, Subtitles, Server, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [settings, setSettings] = useState<UserSettings>(getSettings());

  const update = (partial: Partial<UserSettings>) => {
    const updated = saveSettings(partial);
    setSettings(updated);
    toast.success("Settings saved");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 pb-16 max-w-lg mx-auto px-4">
        <h1 className="font-display text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Settings size={22} />
          Settings
        </h1>

        <div className="space-y-3">
          {/* Skip Duration */}
          <div className="glass rounded-xl p-4 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <SkipForward size={18} className="text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Skip Duration</h3>
                <p className="text-xs text-muted-foreground">Forward/backward skip amount</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => update({ skipDuration: sec })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] ${
                    settings.skipDuration === sec
                      ? "bg-primary text-primary-foreground glow-accent-sm"
                      : "glass glass-hover text-foreground"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Server */}
          <div className="glass rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center gap-3 mb-3">
              <Server size={18} className="text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Preferred Server</h3>
                <p className="text-xs text-muted-foreground">Choose streaming source</p>
              </div>
            </div>
            <div className="flex gap-2">
              {(["primary", "backup"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update({ preferredServer: s })}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-[0.97] capitalize ${
                    settings.preferredServer === s
                      ? "bg-primary text-primary-foreground glow-accent-sm"
                      : "glass glass-hover text-foreground"
                  }`}
                >
                  {s === "primary" ? "VidFast" : "VidSrc"}
                </button>
              ))}
            </div>
          </div>

          {/* Subtitles */}
          <div className="glass rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Subtitles size={18} className="text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Subtitles</h3>
                  <p className="text-xs text-muted-foreground">Enable captions when available</p>
                </div>
              </div>
              <button
                onClick={() => update({ subtitlesEnabled: !settings.subtitlesEnabled })}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  settings.subtitlesEnabled ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.subtitlesEnabled ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto-play */}
          <div className="glass rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap size={18} className="text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Auto-play Next</h3>
                  <p className="text-xs text-muted-foreground">Automatically play next episode</p>
                </div>
              </div>
              <button
                onClick={() => update({ autoPlayNext: !settings.autoPlayNext })}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  settings.autoPlayNext ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.autoPlayNext ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Reduced animations */}
          <div className="glass rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Reduced Animations</h3>
                  <p className="text-xs text-muted-foreground">Simplify motion for accessibility</p>
                </div>
              </div>
              <button
                onClick={() => update({ animationsReduced: !settings.animationsReduced })}
                className={`w-11 h-6 rounded-full transition-all relative ${
                  settings.animationsReduced ? "bg-primary" : "bg-secondary border border-border"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                    settings.animationsReduced ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
