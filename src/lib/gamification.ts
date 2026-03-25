import { supabase } from "@/integrations/supabase/client";

// ─── Badge Definitions ───
export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  check: (stats: UserStats) => boolean;
}

export interface UserStats {
  totalAnime: number;
  totalEpisodes: number;
  totalMinutes: number;
  rewatchCount: number;
  topGenres: string[];
  longestStreak: number;
}

export const BADGES: BadgeDef[] = [
  { id: "first_watch", name: "First Step", description: "Watch your first anime", icon: "👣", rarity: "common", check: (s) => s.totalAnime >= 1 },
  { id: "anime_10", name: "Getting Hooked", description: "Watch 10 anime", icon: "🎣", rarity: "common", check: (s) => s.totalAnime >= 10 },
  { id: "anime_25", name: "Dedicated Viewer", description: "Watch 25 anime", icon: "📺", rarity: "rare", check: (s) => s.totalAnime >= 25 },
  { id: "anime_50", name: "Otaku Rising", description: "Watch 50 anime", icon: "⚡", rarity: "rare", check: (s) => s.totalAnime >= 50 },
  { id: "anime_100", name: "Century Club", description: "Watch 100 anime", icon: "💯", rarity: "epic", check: (s) => s.totalAnime >= 100 },
  { id: "anime_250", name: "Weeb Legend", description: "Watch 250 anime", icon: "👑", rarity: "legendary", check: (s) => s.totalAnime >= 250 },
  { id: "ep_100", name: "Episode Hunter", description: "Watch 100 episodes", icon: "🎯", rarity: "common", check: (s) => s.totalEpisodes >= 100 },
  { id: "ep_500", name: "Marathon Runner", description: "Watch 500 episodes", icon: "🏃", rarity: "rare", check: (s) => s.totalEpisodes >= 500 },
  { id: "ep_1000", name: "Thousand Eyes", description: "Watch 1000 episodes", icon: "👁️", rarity: "epic", check: (s) => s.totalEpisodes >= 1000 },
  { id: "ep_5000", name: "Eternal Watcher", description: "Watch 5000 episodes", icon: "♾️", rarity: "legendary", check: (s) => s.totalEpisodes >= 5000 },
  { id: "time_24h", name: "Full Day", description: "Spend 24 hours watching", icon: "🕐", rarity: "common", check: (s) => s.totalMinutes >= 1440 },
  { id: "time_7d", name: "Week Warrior", description: "Spend 7 days watching", icon: "📅", rarity: "rare", check: (s) => s.totalMinutes >= 10080 },
  { id: "time_30d", name: "Monthly Monk", description: "Spend 30 days watching", icon: "🧘", rarity: "epic", check: (s) => s.totalMinutes >= 43200 },
  { id: "rewatch_5", name: "Nostalgic", description: "Rewatch 5 anime", icon: "🔄", rarity: "rare", check: (s) => s.rewatchCount >= 5 },
  { id: "rewatch_20", name: "Comfort Zone", description: "Rewatch 20 anime", icon: "🏠", rarity: "epic", check: (s) => s.rewatchCount >= 20 },
  { id: "genre_5", name: "Genre Explorer", description: "Watch anime from 5+ genres", icon: "🗺️", rarity: "common", check: (s) => s.topGenres.length >= 5 },
  { id: "genre_10", name: "Taste Connoisseur", description: "Watch anime from 10+ genres", icon: "🎨", rarity: "rare", check: (s) => s.topGenres.length >= 10 },
];

export const RARITY_COLORS: Record<string, string> = {
  common: "from-zinc-500 to-zinc-600",
  rare: "from-blue-500 to-cyan-500",
  epic: "from-purple-500 to-pink-500",
  legendary: "from-amber-400 to-orange-500",
};

export const RARITY_BORDER: Record<string, string> = {
  common: "border-zinc-500/30",
  rare: "border-blue-500/30",
  epic: "border-purple-500/30",
  legendary: "border-amber-400/30",
};

// ─── Personality Titles ───
const TITLES: { title: string; check: (s: UserStats) => boolean }[] = [
  { title: "Legendary Sage", check: (s) => s.totalAnime >= 200 && s.totalEpisodes >= 3000 },
  { title: "Midnight Binger", check: (s) => s.totalEpisodes >= 1000 },
  { title: "Shonen Addict", check: (s) => s.topGenres[0] === "Action" && s.totalAnime >= 20 },
  { title: "Romance Dreamer", check: (s) => s.topGenres[0] === "Romance" && s.totalAnime >= 10 },
  { title: "Fantasy Wanderer", check: (s) => s.topGenres[0] === "Fantasy" && s.totalAnime >= 10 },
  { title: "Horror Enthusiast", check: (s) => s.topGenres.includes("Horror") },
  { title: "Rewatch Royalty", check: (s) => s.rewatchCount >= 10 },
  { title: "Genre Hopper", check: (s) => s.topGenres.length >= 8 },
  { title: "Rising Weeb", check: (s) => s.totalAnime >= 5 },
  { title: "Fresh Otaku", check: (s) => s.totalAnime >= 1 },
];

export function getPersonalityTitle(stats: UserStats): string {
  for (const t of TITLES) {
    if (t.check(stats)) return t.title;
  }
  return "Newcomer";
}

export function getCardRarity(stats: UserStats): "common" | "rare" | "epic" | "legendary" {
  if (stats.totalAnime >= 100 && stats.totalEpisodes >= 2000) return "legendary";
  if (stats.totalAnime >= 50 || stats.totalEpisodes >= 1000) return "epic";
  if (stats.totalAnime >= 15 || stats.totalEpisodes >= 200) return "rare";
  return "common";
}

export function getUserLevel(stats: UserStats): { level: number; xp: number; nextXp: number } {
  const xp = stats.totalAnime * 50 + stats.totalEpisodes * 5 + stats.rewatchCount * 30;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXp = Math.pow(level - 1, 2) * 100;
  const nextLevelXp = Math.pow(level, 2) * 100;
  return { level, xp: xp - currentLevelXp, nextXp: nextLevelXp - currentLevelXp };
}

// ─── Database Helpers ───
export async function getWatchStats(userId: string): Promise<UserStats> {
  const { data } = await supabase
    .from("watch_stats")
    .select("*")
    .eq("user_id", userId);

  const rows = (data as any[]) || [];
  const allGenres = rows.flatMap((r) => r.anime_genres || []);
  const genreCounts: Record<string, number> = {};
  allGenres.forEach((g: string) => { genreCounts[g] = (genreCounts[g] || 0) + 1; });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  return {
    totalAnime: rows.length,
    totalEpisodes: rows.reduce((sum, r) => sum + (r.episodes_watched || 0), 0),
    totalMinutes: rows.reduce((sum, r) => sum + (r.total_watch_time_minutes || 0), 0),
    rewatchCount: rows.reduce((sum, r) => sum + (r.rewatch_count || 0), 0),
    topGenres,
    longestStreak: 0,
  };
}

export async function upsertWatchStat(
  userId: string,
  anime: { id: number; title: string; image: string; genres: string[]; episodes: number | null; duration: number | null },
  episodeWatched: number
) {
  const dur = anime.duration || 24; // minutes per episode

  // Get existing stat
  const { data: existing } = await supabase
    .from("watch_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("anime_id", anime.id)
    .maybeSingle();

  const currentEp = (existing as any)?.episodes_watched || 0;
  const currentTime = (existing as any)?.total_watch_time_minutes || 0;
  
  // Only add time for NEW episodes, not re-calculate from episode number
  const isNewEpisode = episodeWatched > currentEp;
  const isRewatch = episodeWatched <= currentEp && currentEp > 0;
  
  const newEp = Math.max(currentEp, episodeWatched);
  // Add duration for this single episode only if it's new
  const newTime = isNewEpisode ? currentTime + dur : currentTime;

  await supabase.from("watch_stats").upsert({
    user_id: userId,
    anime_id: anime.id,
    anime_title: anime.title,
    anime_image: anime.image,
    anime_genres: anime.genres,
    episodes_watched: newEp,
    total_episodes: anime.episodes,
    total_watch_time_minutes: newTime,
    rewatch_count: (existing as any)?.rewatch_count + (isRewatch ? 1 : 0) || 0,
    last_watched_at: new Date().toISOString(),
  }, { onConflict: "user_id,anime_id" });
}

export async function checkAndAwardBadges(userId: string, stats: UserStats) {
  const { data: existing } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const earned = new Set((existing as any[] || []).map((b) => b.badge_id));
  const newBadges: string[] = [];

  for (const badge of BADGES) {
    if (!earned.has(badge.id) && badge.check(stats)) {
      newBadges.push(badge.id);
    }
  }

  if (newBadges.length > 0) {
    await supabase.from("user_badges").insert(
      newBadges.map((id) => ({ user_id: userId, badge_id: id }))
    );
  }

  return newBadges;
}

export async function getUserBadges(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);
  return (data as any[] || []).map((b) => b.badge_id);
}

export async function getTopAnime(userId: string, limit = 5) {
  const { data } = await supabase
    .from("watch_stats")
    .select("anime_id, anime_title, anime_image, episodes_watched, total_watch_time_minutes")
    .eq("user_id", userId)
    .order("total_watch_time_minutes", { ascending: false })
    .limit(limit);
  return (data as any[]) || [];
}
