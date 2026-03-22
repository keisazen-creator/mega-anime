import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  getWatchStats, getUserBadges, getTopAnime, getPersonalityTitle,
  getCardRarity, getUserLevel, BADGES, RARITY_COLORS, type UserStats
} from "@/lib/gamification";
import { Download, Share2, Loader2, Trophy, Star, Clock, Tv, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const CARD_BG: Record<string, string> = {
  common: "from-zinc-900 via-zinc-800 to-zinc-900",
  rare: "from-slate-900 via-blue-950 to-slate-900",
  epic: "from-purple-950 via-fuchsia-950 to-purple-950",
  legendary: "from-amber-950 via-orange-950 to-amber-950",
};

const CARD_ACCENT: Record<string, string> = {
  common: "text-zinc-400",
  rare: "text-blue-400",
  epic: "text-purple-400",
  legendary: "text-amber-400",
};

const CARD_GLOW: Record<string, string> = {
  common: "",
  rare: "shadow-[0_0_40px_hsl(210,80%,50%,0.15)]",
  epic: "shadow-[0_0_40px_hsl(280,80%,50%,0.15)]",
  legendary: "shadow-[0_0_60px_hsl(40,90%,50%,0.2)]",
};

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  if (h < 24) return `${h}h ${minutes % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

const IdentityCardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [topAnime, setTopAnime] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null }>({ display_name: null, avatar_url: null });

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getWatchStats(user.id),
      getUserBadges(user.id),
      getTopAnime(user.id, 5),
      supabase.from("profiles").select("display_name, avatar_url").eq("user_id", user.id).maybeSingle(),
    ]).then(([s, b, t, p]) => {
      setStats(s);
      setBadges(b);
      setTopAnime(t);
      if (p.data) setProfile(p.data as any);
      setLoading(false);
    });
  }, [user]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `otakucloud-card-${profile.display_name || "user"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Card downloaded!");
    } catch {
      toast.error("Download failed — try a screenshot instead");
    }
  }, [profile.display_name]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      await navigator.share({
        title: "My OtakuCloud Identity Card",
        text: `I'm a ${stats ? getPersonalityTitle(stats) : "Newcomer"} on OtakuCloud! Check out my anime stats.`,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied!");
    }
  }, [stats]);

  if (!user) {
    navigate("/login");
    return null;
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      </div>
    );
  }

  const rarity = getCardRarity(stats);
  const title = getPersonalityTitle(stats);
  const level = getUserLevel(stats);
  const earnedBadgeDefs = BADGES.filter((b) => badges.includes(b.id));
  const displayName = profile.display_name || user.email?.split("@")[0] || "Otaku";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 max-w-2xl mx-auto px-4">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2 text-center">
          Anime Identity Card
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          Your unique anime fingerprint — share it with the world
        </p>

        {/* THE CARD */}
        <div className="flex justify-center mb-6">
          <div
            ref={cardRef}
            className={`relative w-full max-w-[420px] rounded-2xl overflow-hidden bg-gradient-to-br ${CARD_BG[rarity]} border border-white/10 ${CARD_GLOW[rarity]}`}
            style={{ aspectRatio: "3 / 4.2" }}
          >
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }} />

            <div className="relative z-10 p-6 h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="font-display font-bold text-primary-foreground text-[10px]">O</span>
                  </div>
                  <span className="font-display font-semibold text-foreground text-xs tracking-wider uppercase">OtakuCloud</span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${RARITY_COLORS[rarity]} bg-clip-text text-transparent`}>
                  {rarity}
                </span>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <span className="font-display font-bold text-primary text-lg">{displayName[0]?.toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-foreground text-base truncate">{displayName}</h2>
                  <p className={`text-xs font-semibold ${CARD_ACCENT[rarity]}`}>{title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted-foreground">Lv.{level.level}</span>
                    <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full bg-gradient-to-r ${RARITY_COLORS[rarity]}`} style={{ width: `${(level.xp / level.nextXp) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                {[
                  { icon: Tv, label: "Anime", value: stats.totalAnime },
                  { icon: Star, label: "Episodes", value: stats.totalEpisodes.toLocaleString() },
                  { icon: Clock, label: "Watch Time", value: formatTime(stats.totalMinutes) },
                  { icon: RotateCcw, label: "Rewatches", value: stats.rewatchCount },
                ].map((s, i) => (
                  <div key={i} className="rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <s.icon size={10} className="text-muted-foreground" />
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-display font-bold text-foreground text-sm tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>

              {/* Top Genres */}
              {stats.topGenres.length > 0 && (
                <div className="mb-4">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Top Genres</span>
                  <div className="flex flex-wrap gap-1">
                    {stats.topGenres.slice(0, 5).map((g) => (
                      <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-foreground">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top 5 Anime */}
              {topAnime.length > 0 && (
                <div className="mb-4 flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Top 5 Anime</span>
                  <div className="flex gap-1.5">
                    {topAnime.map((a, i) => (
                      <div key={i} className="relative w-10 h-14 rounded-md overflow-hidden border border-white/10 flex-shrink-0">
                        {a.anime_image ? (
                          <img src={a.anime_image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-secondary flex items-center justify-center text-[8px] text-muted-foreground">{i + 1}</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-background/70 text-center">
                          <span className="text-[7px] font-bold text-foreground">#{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges row */}
              {earnedBadgeDefs.length > 0 && (
                <div className="mb-3">
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground mb-1 block">Badges ({earnedBadgeDefs.length})</span>
                  <div className="flex gap-1 flex-wrap">
                    {earnedBadgeDefs.slice(0, 8).map((b) => (
                      <span key={b.id} className="text-sm" title={b.name}>{b.icon}</span>
                    ))}
                    {earnedBadgeDefs.length > 8 && (
                      <span className="text-[10px] text-muted-foreground">+{earnedBadgeDefs.length - 8}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="mt-auto pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className="text-[8px] text-muted-foreground tracking-wider">otakucloud.app</span>
                <span className="text-[8px] text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium active:scale-[0.97] transition-transform"
          >
            <Download size={14} />
            Download Card
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors active:scale-[0.97]"
          >
            <Share2 size={14} />
            Share
          </button>
        </div>

        {/* Badges Section */}
        <div className="mt-12">
          <h2 className="font-display text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Trophy size={18} className="text-primary" />
            Your Badges
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            {earnedBadgeDefs.length} / {BADGES.length} earned
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BADGES.map((badge) => {
              const earned = badges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-3 transition-all duration-300 ${
                    earned
                      ? `bg-white/[0.04] ${RARITY_BORDER[badge.rarity]} border-opacity-100`
                      : "bg-white/[0.02] border-white/[0.04] opacity-40 grayscale"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-xl">{badge.icon}</span>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-foreground text-xs truncate">{badge.name}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{badge.description}</p>
                      <span className={`text-[8px] uppercase tracking-widest font-bold bg-gradient-to-r ${RARITY_COLORS[badge.rarity]} bg-clip-text text-transparent`}>
                        {badge.rarity}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityCardPage;
