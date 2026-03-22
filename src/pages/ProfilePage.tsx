import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getWatchStats, getUserBadges, getUserLevel, getPersonalityTitle, getTopAnime, BADGES, RARITY_COLORS, getCardRarity, type UserStats } from "@/lib/gamification";
import { LogOut, Mail, Camera, Loader2, Settings, CreditCard, Trophy, Tv, Star, Clock, Edit2, ImagePlus } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<{
    display_name: string | null; avatar_url: string | null;
    banner_url: string | null; bio: string | null;
  }>({ display_name: null, avatar_url: null, banner_url: null, bio: null });
  const [uploading, setUploading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [editingBio, setEditingBio] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [topAnime, setTopAnime] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url, banner_url, bio")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile(data as any);
          setDisplayName((data as any).display_name || "");
          setBio((data as any).bio || "");
        }
      });
    getWatchStats(user.id).then(setStats);
    getUserBadges(user.id).then(setBadges);
    getTopAnime(user.id, 5).then(setTopAnime);
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const uploadFile = async (file: File, type: "avatar" | "banner") => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = data.publicUrl + `?t=${Date.now()}`;
    const col = type === "avatar" ? "avatar_url" : "banner_url";
    await supabase.from("profiles").update({ [col]: url }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, [col]: url }));
    toast.success(`${type === "avatar" ? "Avatar" : "Banner"} updated!`);
    setUploading(false);
  };

  const handleNameSave = async () => {
    if (!user || !displayName.trim()) return;
    await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, display_name: displayName.trim() }));
    toast.success("Name updated!");
  };

  const handleBioSave = async () => {
    if (!user) return;
    await supabase.from("profiles").update({ bio: bio.trim() || null }).eq("user_id", user.id);
    setProfile((p) => ({ ...p, bio: bio.trim() || null }));
    setEditingBio(false);
    toast.success("Bio updated!");
  };

  if (!user) {
    navigate("/login");
    return null;
  }

  const level = stats ? getUserLevel(stats) : null;
  const title = stats ? getPersonalityTitle(stats) : "Newcomer";
  const rarity = stats ? getCardRarity(stats) : "common";
  const earnedBadges = BADGES.filter((b) => badges.includes(b.id));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Banner */}
      <div className="relative w-full h-36 sm:h-48 bg-gradient-to-br from-primary/20 to-accent/10 overflow-hidden">
        {profile.banner_url && (
          <img src={profile.banner_url} alt="" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <button
          onClick={() => bannerRef.current?.click()}
          disabled={uploading}
          className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-background/60 backdrop-blur-sm text-xs text-foreground flex items-center gap-1.5 hover:bg-background/80 transition-colors active:scale-[0.97]"
        >
          <ImagePlus size={12} />
          {uploading ? "Uploading..." : "Edit Banner"}
        </button>
        <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "banner")} />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-12 relative z-10 pb-16">
        {/* Avatar + Basic Info */}
        <div className="flex items-end gap-4 mb-6">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/20 border-4 border-background flex items-center justify-center overflow-hidden shadow-lg">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-display text-2xl font-bold text-primary">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => avatarRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity active:scale-95"
            >
              {uploading ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], "avatar")} />
          </div>

          <div className="min-w-0 pb-1">
            <h1 className="font-display text-lg sm:text-xl font-bold text-foreground truncate">
              {profile.display_name || user.email?.split("@")[0]}
            </h1>
            <p className="text-xs text-primary font-semibold">{title}</p>
            {level && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-muted-foreground font-medium">Lv.{level.level}</span>
                <div className="w-20 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                    style={{ width: `${(level.xp / level.nextXp) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="glass rounded-xl p-4 mb-4 border border-white/5">
          {editingBio ? (
            <div className="space-y-2">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell everyone about yourself..."
                maxLength={200}
                rows={3}
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setEditingBio(false)} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                <button onClick={handleBioSave} className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium active:scale-[0.97]">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-muted-foreground">{profile.bio || "No bio yet — click edit to add one"}</p>
              <button onClick={() => setEditingBio(true)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                <Edit2 size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Display Name */}
        <div className="glass rounded-xl p-4 mb-4 border border-white/5">
          <label className="text-xs text-muted-foreground mb-1.5 block">Display Name</label>
          <div className="flex gap-2">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={handleNameSave}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium active:scale-[0.97]"
            >
              Save
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
            <Mail size={12} />
            {user.email}
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="glass rounded-xl p-4 mb-4 border border-white/5">
            <h2 className="font-display font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <Tv size={14} className="text-primary" /> Watch Stats
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { icon: "📺", label: "Anime", value: stats.totalAnime },
                { icon: "🎬", label: "Episodes", value: stats.totalEpisodes.toLocaleString() },
                { icon: "⏱️", label: "Watch Time", value: `${Math.floor(stats.totalMinutes / 60)}h` },
                { icon: "🔄", label: "Rewatches", value: stats.rewatchCount },
              ].map((s, i) => (
                <div key={i} className="rounded-lg bg-secondary/50 p-3 text-center">
                  <span className="text-lg block mb-1">{s.icon}</span>
                  <span className="font-display font-bold text-foreground text-base block tabular-nums">{s.value}</span>
                  <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Top Genres */}
            {stats.topGenres.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Top Genres</span>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topGenres.slice(0, 6).map((g) => (
                    <span key={g} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-foreground">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Top Anime */}
            {topAnime.length > 0 && (
              <div className="mt-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 block">Most Watched</span>
                <div className="flex gap-2">
                  {topAnime.map((a, i) => (
                    <Link key={i} to={`/anime/${a.anime_id}`} className="relative w-12 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 hover:scale-105 transition-transform">
                      {a.anime_image ? (
                        <img src={a.anime_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-[8px] text-muted-foreground">#{i + 1}</div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        <div className="glass rounded-xl p-4 mb-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-semibold text-foreground text-sm flex items-center gap-2">
              <Trophy size={14} className="text-primary" /> Badges
            </h2>
            <Link to="/identity-card" className="text-[10px] text-primary hover:underline">{earnedBadges.length}/{BADGES.length}</Link>
          </div>
          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {earnedBadges.map((b) => (
                <div key={b.id} className="rounded-lg bg-secondary/50 p-2 text-center">
                  <span className="text-xl block mb-0.5">{b.icon}</span>
                  <span className="text-[9px] text-foreground font-medium line-clamp-1">{b.name}</span>
                  <span className={`text-[7px] uppercase tracking-widest font-bold bg-gradient-to-r ${RARITY_COLORS[b.rarity]} bg-clip-text text-transparent`}>
                    {b.rarity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Watch anime to earn badges!</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            to="/identity-card"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
          >
            <CreditCard size={14} />
            My Identity Card
          </Link>

          <Link
            to="/settings"
            className="w-full py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            <Settings size={14} />
            Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
